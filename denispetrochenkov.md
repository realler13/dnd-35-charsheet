# D&D 3.5 Character Sheet — Project Deep Dive

## What Is This?

A web-based character sheet builder for Dungeons & Dragons 3.5 Edition — the crunchy, math-heavy ruleset that tabletop veterans love. Think of it as a digital version of the old HeroForge Anew Excel spreadsheet, but rebuilt for the browser with no dependencies, no build step, and a comprehensive game database sourced from PCGen.

The app lets you create a character, pick a race and classes, allocate ability scores, choose feats, manage skills, track inventory, prepare spells, and log adventures — all while it automatically crunches the numbers behind the scenes (ability modifiers, BAB, saving throws, carrying capacity, spell DCs, the works).

## Technical Architecture

### The Big Picture

This is a **zero-dependency vanilla JavaScript app**. No React, no Vue, no bundler — just ES6 classes loaded via `<script>` tags in a specific order. It's surprisingly well-structured despite the simplicity: a clear separation between data model, rules engine, and UI rendering.

The architecture follows a pattern you'd recognize from early MVC frameworks:

```
User clicks something
    → Tab UI calls character.updateX()
        → Character.notifyListeners()
            → app.recalculateAll()
                → calculator.calculateAll(characterData) → computed stats
                    → app.refreshCurrentTab() → re-render
```

Every change to the character triggers a full recalculation of everything. This sounds expensive, but the calculations are pure math on in-memory objects — no DOM reads, no network calls — so it's effectively instant.

### The Four Pillars

**1. DataLoader** (`js/dataLoader.js`) — The Librarian

When the app starts, DataLoader fetches all the game data — races, classes, skills, feats, spells, weapons, items — from JSON files in `data/json/`. Everything goes into `Map` objects keyed by name, which makes lookups O(1).

There's also a layer of legacy CSV fallbacks (`Tables.csv`, `CreatureInfo.csv`) for data that hasn't been fully migrated yet. And some things (size modifiers, spell progression tables, the skill-class matrix) are just hardcoded because they're fixed D&D rules that never change.

The clever bit: `loadAllData()` fires everything in parallel via `Promise.all()`, so data loading is fast even with 10+ JSON files.

**2. Character** (`js/character.js`) — The Source of Truth

A singleton that holds the entire character state as a big nested object. Every property — ability scores, class levels, skill ranks, feats, inventory, spell slots — lives here.

The observer pattern drives the whole app: call any `character.updateX()` method, and it calls `notifyListeners()`, which triggers the recalculation cascade. This is beautifully simple and means you never have stale state.

One really important method: `migrateCharacterData()`. This runs every time you load a saved character and patches in any fields that were added in later versions (feats, flaws, spell slot tracking, etc.). It's the reason old saves don't break when you add new features — a pattern worth remembering for any app with persistent user data.

**3. Calculator** (`js/calculator.js`) — The Rules Engine

This is where D&D 3.5's math lives. Takes raw character data plus game data references and computes everything: ability modifiers, BAB from class progression, saving throw bases, hit points, armor class (all three types!), initiative, attack bonuses, carrying capacity, spell slots per day.

The interesting design choice: `calculateAll()` returns a big stats object that gets passed around to all the tabs. Each tab just reads what it needs — it never touches the Character model directly for computed values.

One thing to watch out for: `calculateFeatBonuses()` gets called multiple times per recalculation cycle because it's invoked from inside `calculateSaves()`, `calculateHP()`, `calculateAC()`, `calculateInitiative()`, and `calculateSkillModifier()` independently. If feat processing ever gets expensive, this is where you'd want to cache.

**4. Storage** (`js/storage.js`) — The Persistence Layer

Saves characters to `localStorage` with a simple prefix-based key scheme. A separate key tracks the list of all saved character names.

The autosave is elegant: a dirty flag plus a 5-second debounce timer. Any character change marks it dirty and schedules a save. If another change comes in before the timer fires, it resets. This means you can type rapidly without hammering localStorage.

### The Tab System

Each tab is its own class (e.g., `AbilitiesTab`, `ClassesTab`, `SkillsTab`) with a `render()` method. The main app tracks which tab is active and only re-renders that one on changes. Tabs are self-contained — they know how to build their own DOM, wire up their own event handlers, and read from both the character model and game data.

### The Feat System — A Case Study in Parsing

The feat system is one of the more sophisticated parts. Three files work together:

- **`featParser.js`** does the heavy lifting: it takes a feat's benefit text (natural language like "+2 bonus on all Fortitude saving throws") and extracts numeric bonuses using a series of regex patterns. It handles saves, HP, initiative, skills, attack/damage, AC, and special effects like metamagic. It also categorizes feats (automatic bonuses vs. manual tracking vs. informational).

- **`featChoices.js`** knows which feats need user input (Skill Focus needs a skill, Weapon Focus needs a weapon, Spell Focus needs a school) and provides the option lists.

- **`calculator.js:calculateFeatBonuses()`** aggregates everything — loops through the character's feats, looks up each one in the database, runs it through the parser, and sums up all the bonuses.

The flaw system works similarly but in reverse — `processFlawPenalties()` extracts penalties from flaw text and feeds them into every calculation that's affected.

### The Data Pipeline

Game data comes from PCGen 6.08.00RC10 (an open-source RPG character generator). The pipeline:

1. **PCGen LST files** — tab-delimited format with domain-specific tags
2. **Parser** (`parsers/pcgen_lst_parser.py`) — reads LST files
3. **Transformers** (`transformers/*.py`) — one per data type, converts parsed data to clean JSON
4. **Orchestrator** (`migrate_pcgen_to_json.py`) — runs the full pipeline
5. **Output**: `data/json/*.json` — what the app actually loads

Each JSON file has a metadata block (source, version, timestamp, entry count) which is good practice for any data pipeline.

## The Codebase Structure

```
js/
├── app.js              # Main controller — orchestrates everything
├── character.js        # Character data model (singleton)
├── calculator.js       # D&D 3.5 rules engine
├── dataLoader.js       # Loads all game data from JSON/CSV
├── storage.js          # localStorage + file export/import
├── featParser.js       # Extracts numeric bonuses from feat text
├── featChoices.js      # Defines feat choice UI (skill, weapon, school)
└── ui/
    ├── characterTab.js # Read-only character sheet display
    ├── abilitiesTab.js # Race selection, ability score management
    ├── classesTab.js   # Class level management
    ├── skillsTab.js    # Skill rank allocation per level
    ├── featsTab.js     # Feat selection with prerequisites
    ├── inventoryTab.js # Wealth, items, carrying capacity
    ├── spellsTab.js    # Spell management and slot tracking
    └── gameLogTab.js   # Adventure logging

data/json/              # Primary game data (loaded at runtime)
parsers/                # PCGen LST file parser (Python)
transformers/           # Data transformers, one per type (Python)
```

## Lessons & Patterns

### The Observer Pattern Scales Surprisingly Well
The `character.addListener()` → `notifyListeners()` pattern is dead simple but powers the entire app. Any change, anywhere, triggers a full recalc and re-render of the active tab. You might think this would be slow, but pure math on in-memory data is fast. The lesson: don't optimize for performance until you need to.

### Migration Functions Are an Investment
`migrateCharacterData()` is called on every load. It adds missing fields to old saves. This means you can keep adding features without breaking existing characters. If you're building anything with persistent user data, bake this pattern in from day one.

### Regex-Based Text Parsing Is Fragile But Practical
The feat parser uses ~15 regex patterns to extract bonuses from natural language text. It works for the common cases but can't handle everything (some feats have very complex conditional effects). The categorization system (`automatic`, `manual`, `informational`) is a smart way to handle this: automate what you can, and gracefully degrade for the rest.

### Map Over Object for Game Data
Using `Map` instead of plain objects for game data lookups was a good call. Maps have guaranteed O(1) lookups, preserve insertion order, and have a cleaner API for the "look up by name" pattern that dominates this codebase.

### No Build Step = Fast Iteration
With no bundler, framework, or build process, changes are visible on browser refresh. The tradeoff is manual script ordering in index.html — add a new JS file and you need to add the `<script>` tag in the right place. Worth it for a project of this size.

## Potential Pitfalls

- **Script load order**: If you add a new JS file, it must be added to `index.html` in the correct position. `dataLoader.js` must come first, `app.js` must come last, and `featChoices.js` must precede `featsTab.js`.
- **Repeated feat bonus calculation**: `calculateFeatBonuses()` runs multiple times per `calculateAll()` call. If you add expensive feat processing, consider caching per calculation cycle.
- **Hardcoded spell progression**: Only Wizard, Cleric, Druid, Sorcerer, and Bard have spell tables. Adding new caster classes requires editing `calculator.js:getSpellProgressionTable()`.
- **Skill-class matrix is hardcoded**: The mapping of which skills are class skills for which classes is in `dataLoader.js:createSkillClassMatrix()`, not derived from the JSON data.
- **localStorage limits**: Characters are saved per-name with prefix `dnd35_character_`. Heavy use with many characters could hit the ~5MB browser limit. The app warns on quota exceeded but has no automatic cleanup.
- **CORS/file:// issues**: The app **must** be served via HTTP (not opened as a local file) because it uses `fetch()` for JSON loading.

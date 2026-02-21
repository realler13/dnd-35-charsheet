# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Application

This is a zero-build, pure vanilla JavaScript web app. Serve it with any static file server:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

**Must be served via HTTP** — `file://` protocol will fail because the app fetches JSON data files via `fetch()`.

## Updating Game Data from PCGen

```bash
# Full migration (all categories)
python3 migrate_pcgen_to_json.py

# Single category
python3 migrate_pcgen_to_json.py skills
```

PCGen LST source files live in `data/pcgen-6.08.00RC10/`. Migration outputs to `data/json/`.

## Running Parser Tests

```bash
python3 -m pytest tests/test_parsers.py
python3 test_feat_parser.py
```

## Architecture

### Data Flow

The app follows a unidirectional data flow: **Character (model)** → **Calculator (rules engine)** → **Tab UIs (views)**.

1. `DnDCharacterSheet` (app.js) orchestrates everything — loads data, wires up the listener, manages tabs
2. `Character` (character.js) is the single source of truth for character state. Every mutation calls `notifyListeners()`, which triggers a full recalculation
3. `Calculator` (calculator.js) takes raw character data + game data and produces computed stats (abilities, BAB, saves, HP, AC, spell slots, etc.)
4. Tab UI classes read the computed stats and render. Each tab class owns a `<div>` in index.html

The change cycle: **User edits something in a Tab** → Tab calls `character.updateX()` → Character notifies listeners → `app.recalculateAll()` → `calculator.calculateAll()` → `app.refreshCurrentTab()` re-renders

### Key Singletons (all on `window`)

- `dataLoader` — loads all game data (JSON + CSV) into `Map` objects at startup
- `character` — the Character model instance
- `calculator` — the Calculator instance (initialized after dataLoader)
- `characterStorage` — handles localStorage save/load, autosave (5s timer), and JSON export/import
- `app` — the DnDCharacterSheet controller

### Script Load Order Matters

Scripts are loaded via `<script>` tags in index.html (no bundler). Order is critical:
1. Core: `dataLoader.js` → `character.js` → `featParser.js` → `calculator.js` → `storage.js`
2. UI tabs: `characterTab.js` → `abilitiesTab.js` → ... → `gameLogTab.js`
3. `featChoices.js` must load before `featsTab.js`
4. `app.js` loads last and kicks off `init()`

### Game Data Loading

`DataLoader.loadAllData()` runs all loaders in parallel via `Promise.all()`. Data sources:
- **Primary**: `data/json/*.json` — races, classes, skills, feats, flaws, spells, weapons, items, languages, custom_items
- **Legacy CSV fallbacks**: `data/Tables.csv`, `data/CreatureInfo.csv`, `data/WeaponInfo.csv`
- **Hardcoded**: size modifiers, carrying capacity fallbacks, skill-class matrix, class specializations, spell progression tables

Game data is stored in `Map` objects (keyed by name) except `skills` which is an array. The `skillClassMatrix` maps class names to `Set` of class skill names, with special handling for `"Knowledge (all)"`.

### Feat System

The feat system has three cooperating modules:
- `featParser.js` — parses feat benefit text with regex to extract numeric bonuses (saves, HP, initiative, skills, attack, damage, AC). Also categorizes feats as `automatic`, `manual`, `informational`, `metamagic`, or `special_ui`
- `featChoices.js` — defines which feats need user choices (Skill Focus → pick a skill, Weapon Focus → pick a weapon, etc.) and provides option lists
- `calculator.js:calculateFeatBonuses()` — aggregates all feat bonuses for a character. Gets called from multiple calculation methods (saves, HP, AC, initiative, skills)

**Important**: `calculateFeatBonuses()` is called multiple times per `calculateAll()` cycle (from each individual calc method). This is intentional but worth knowing for performance.

### Character Data Migration

`character.js:migrateCharacterData()` runs on every `setData()` call to ensure backwards compatibility when loading older character saves. It adds missing fields (feats, flaws, languages, slotsUsed, item source/cost/properties).

### Flaw System

Flaws provide penalties parsed from text descriptions. `calculator.processFlawPenalties()` extracts AC, attack, save, initiative, and skill penalties using regex patterns, then feeds them into every relevant calculation method.

### Spell System

Spell progression tables are hardcoded in `calculator.js` for Wizard, Cleric, Druid, Sorcerer, and Bard. Bonus spells are calculated from the casting ability score. Spell slot usage is tracked per level with cast/reset functionality.

### Storage

Characters are saved to `localStorage` with prefix `dnd35_character_`. A separate key (`dnd35_character_list`) tracks all saved character names. Autosave triggers 5 seconds after any change via the dirty flag + timer pattern.

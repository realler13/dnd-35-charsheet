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

## Phase 1: The Realmshelps Data Pipeline

### The Problem

The original game data came from PCGen LST files, which are great for structured mechanical data (stats, numbers, progressions) but terrible for human-readable descriptions. A feat might have correct numeric bonuses but its "benefit" field would just be the PCGen formula, not the actual text a player would read. Skills had `.MOD` entries (PCGen overrides that don't make sense in isolation), races had 3,275 entries (mostly monsters), and classes had placeholder entries full of `REPEATLEVEL` tags.

### The Solution: Dual-Source Data Pipeline

We built parsers for realmshelps.net, a Forgotten Realms reference site with beautifully written game content in HTML format. Then we created a consolidation script that merges the best of both worlds: PCGen's structured data + realmshelps' rich descriptions.

### The Parsers

All parsers follow the same pattern established by the feat and spell parsers:

1. **`parsers/realmshelps_skill_parser.py`** — Parses skill `.shtml` pages. The skill name and ability score come from the `<h1>` tag (e.g., `"Hide (Dex; Armor Check Penalty)"`), which gets decomposed into name, ability code, trained-only flag, and armor check penalty flag. Labeled sections (`Check`, `Action`, `Synergy`, etc.) are extracted by regex patterns that look for `<b>Label</b>:` markers and grab everything until the next label. Produces 43 core skills.

2. **`parsers/realmshelps_race_parser.py`** — Parses race pages from subdirectories (`dwarf/`, `elf/`, `gnome/`, etc.). The interesting challenge: core races like Dwarf and Elf are in `index.shtml` files inside their subdirectories, so we can't blindly skip all `index.shtml` files. The parser only skips index pages in listing directories (top-level `races/`, `under/`, `east/`, etc.) while keeping the ones in race directories. Ability adjustments are extracted from racial traits text with patterns like `+2 Constitution, -2 Charisma`. Size, speed, and languages are similarly regex-extracted from the `<li>` items in the Racial Traits section. A notable lesson: the `SKIP_FILES` set ended up being quite large because many pages in these directories are lore articles, not actual race entries.

3. **`parsers/realmshelps_class_parser.py`** — Parses the 11 core base classes. The level progression table (`<table>` with BAB/Fort/Ref/Will columns and "Hit Die: dN" header) is the richest data source. BAB classification was surprisingly tricky: you can't just look at level 1 values because both 3/4 BAB (Bard, Rogue) and 1/2 BAB (Wizard, Sorcerer) start at +0. The differentiator is level 3: 3/4 BAB classes have +2, 1/2 BAB classes have +1. Class features are extracted from `<b>` or `<strong>` labeled paragraphs (different pages use different tags!), plus italic sub-features for things like Bardic Music abilities. The feature extraction boundary is the "Hit Die" table, not just any `<table>`, because some classes (Ranger) have data tables mid-feature-section.

### The Consolidation Script (`consolidate_all_data.py`)

This is the brain of the pipeline. For each data type, it has a specific merge strategy:

- **Skills**: Realmshelps provides descriptions; PCGen provides subcategories (Craft (Alchemy), Knowledge (Arcana), etc.). All `.MOD` entries are stripped. Result: 90 clean skills, zero `.MOD` entries.
- **Feats**: Realmshelps is primary (3,385 feats with rich text). PCGen fills in any gaps and provides `choice` metadata. Result: 3,421 feats, all with descriptions.
- **Flaws**: Existing data enriched from realmshelps. Empty effects filled by regex extraction from description text. Result: 92 flaws, zero empty effects.
- **Races**: Heavy filtering - must have 2+ racial traits to be included (eliminates lore articles). Names cleaned: "Raptoran Character Race" -> "Raptoran", "Gray Orc Race" -> "Gray Orc", etc. Result: 49 playable races, down from 3,275.
- **Classes**: Core 11 base classes only, with full feature extraction. Result: 11 classes with proper hit dice, BAB, saves, skills, and feature lists.
- **Spells**: PCGen primary (full mechanical data), realmshelps fills missing descriptions. PCGen `CASTERLEVEL` expressions cleaned. Result: 4,686 spells.

### Bugs We Squashed

1. **BAB misclassification**: The original BAB classifier checked level 1 only. Both Sorcerer (+0) and Bard (+0) looked identical. Fixed by checking level 3 values (Bard=+2, Sorcerer=+1).

2. **Missing core race data**: Dwarf, Elf, Gnome, Halfling were completely missing from parsed output because `index.shtml` was in the skip list. These races live in `dwarf/index.shtml`, `elf/index.shtml`, etc. Fixed by only skipping index files in category-listing directories, not race-data directories.

3. **Rogue had zero features**: The Rogue page uses `<strong>` tags instead of `<b>` for feature names. The parser only matched `<b>`. Fixed by matching both `<b>` and `<strong>`.

4. **Ranger had only 1 feature**: A Favored Enemies `<table>` appeared mid-features-section. The section boundary regex stopped at any `<table class=`, cutting off most features. Fixed by only stopping at tables containing "Hit Die" (the level progression table).

5. **Lore articles polluting race list**: Pages like "An Elven Lexicon", "Walk & Riddle - The Secret Life of Halflings", and "Mountain Ghosts - Dwarf Ninjas" were being parsed as races. Fixed with aggressive skip lists and a minimum-2-racial-traits requirement in the consolidation.

## Phase 2: Light Theme + Theme Switcher + Rebranding

### The Problem

The app had a gorgeous dark "Fantasy Grimoire" aesthetic, but dark-only isn't great for every situation — daytime gaming sessions, printing notes, or players who just prefer light backgrounds. Also, "D&D" in the title is a trademark concern for a web app.

### The Rebranding

Simple find-and-replace across four user-facing strings: `<title>`, header `<h1>`, footer `<p>`, and a flaw info paragraph. "D&D 3.5 Character Sheet" became "3.5 Character Sheet" and "In D&D 3.5" became "In 3.5 edition". Developer-facing references (console logs, class names, code comments) were left untouched — they're internal, not user-visible, and renaming `DnDCharacterSheet` would be churn with no benefit.

### The Light Theme — Warm Parchment, Not Hospital White

The CSS was already well-structured with ~30 CSS custom properties in `:root`, so theming was mostly about defining a `[data-theme="light"]` override block. The key design decision: **don't just invert the dark theme**. A light D&D character sheet should feel like aged parchment and a scholar's study, not a clinical white interface.

The palette: cream backgrounds (`#e8e0d0` → `#faf6ee`), deep brown text (`#2c2418`), bronze/copper accents (`#8b6914`, `#c9a84c`) replacing the dark theme's gold. Shadows use warm brown tints instead of black, at lower opacities. The grain overlay (a subtle SVG noise texture) drops from 40% to 15% opacity.

**The tricky parts were the hardcoded colors.** Several elements used inline colors rather than variables:
- The header gradient had a hardcoded `#1c1a26` start color → needed a `[data-theme="light"] header` override
- `.btn-danger` used hardcoded `#991b1b` background and `#fca5a5`/`#fecaca` text → needed light-mode overrides
- `.btn-primary` used `var(--bg-deep)` for text color, which in light mode would be light-on-light → overridden to cream-on-bronze
- Status badges (load status, skill points) used `rgba()` tints that needed adjustment for light backgrounds
- The modal overlay's black backdrop needed to become a warm semi-transparent brown

### The Theme Switcher

Three pieces working together:

1. **HTML**: A toggle button in `.header-right` with a `.theme-icon` span. Uses CSS `::before` content switching: ☀️ (sun) in dark mode → 🌙 (moon) in light mode. Placed first in the header-right group so it's always visible.

2. **CSS**: The `.btn-theme-toggle` is styled as a compact square button that fits the existing button row. The icon swap is pure CSS — `[data-theme="light"] .theme-icon::before { content: '🌙'; }`.

3. **JavaScript** (in `app.js`): Two methods on `DnDCharacterSheet`:
   - `initTheme()` — reads `localStorage.getItem('dnd35_theme')` and sets `data-theme` on `<html>`. Called at the very start of `init()` to prevent a flash of the wrong theme.
   - `toggleTheme()` — flips the attribute and saves to localStorage. Uses `removeAttribute` for dark (the default) instead of `setAttribute('data-theme', 'dark')` to keep the fallback behavior clean.

The theme toggle is wired up in `setupCharacterManagement()` alongside all the other header buttons.

### Design Lessons

- **CSS variables make theming almost free** — if your colors are all in `:root` variables, a theme is just an override block. The ~50 lines of variable overrides handle 90% of the visual change.
- **But hardcoded colors create tech debt** — every `rgba()` or hex literal that should have been a variable required a targeted `[data-theme="light"]` selector override. Future CSS should always go through variables.
- **"Light" doesn't mean "white"** — generic light themes look cheap. The parchment/bronze palette maintains the fantasy aesthetic while being comfortable in bright environments.
- **localStorage for theme is instant** — unlike media queries, a stored preference loads synchronously before first paint (when called early in init), so there's no flash.

## Potential Pitfalls

- **Script load order**: If you add a new JS file, it must be added to `index.html` in the correct position. `dataLoader.js` must come first, `app.js` must come last, and `featChoices.js` must precede `featsTab.js`.
- **Repeated feat bonus calculation**: `calculateFeatBonuses()` runs multiple times per `calculateAll()` call. If you add expensive feat processing, consider caching per calculation cycle.
- **Hardcoded spell progression**: Only Wizard, Cleric, Druid, Sorcerer, and Bard have spell tables. Adding new caster classes requires editing `calculator.js:getSpellProgressionTable()`.
- **Skill-class matrix is hardcoded**: The mapping of which skills are class skills for which classes is in `dataLoader.js:createSkillClassMatrix()`, not derived from the JSON data.
- **localStorage limits**: Characters are saved per-name with prefix `dnd35_character_`. Heavy use with many characters could hit the ~5MB browser limit. The app warns on quota exceeded but has no automatic cleanup.
- **CORS/file:// issues**: The app **must** be served via HTTP (not opened as a local file) because it uses `fetch()` for JSON loading.

## Phase 3 Research: Desktop App Wrapping Options (February 2026)

### The Goal

Turn this zero-build vanilla JS web app into a standalone macOS desktop application. The constraints: no server-side logic, uses `fetch()` for local JSON data, relies on `localStorage` for persistence, and ideally shouldn't require adopting a build system or rewriting anything.

### The Contenders

We evaluated six approaches: Electron, Tauri, Neutralinojs, PWA, pywebview, and a native Swift/WKWebView wrapper. Here's what we found.

---

### 1. Electron — The Reliable Heavyweight

**How it works**: Bundles a full Chromium browser + Node.js runtime into your app. Your HTML/CSS/JS runs inside this private Chromium instance. It's essentially shipping a dedicated browser with your app baked in.

**Bundle size**: ~115-150 MB minimum for a "Hello World" app. Your actual app code is negligible next to Chromium's weight. DMG installers compress to ~80 MB, but the installed `.app` bundle expands significantly.

**Setup for a vanilla JS app**: Requires Node.js and npm. You'd create a `package.json` and a `main.js` entry point (~20 lines) that creates a `BrowserWindow` and loads your `index.html`. Electron Forge (`npm init electron-app@latest`) scaffolds this instantly. Total setup: ~15 minutes.

**fetch() to local files**: Works out of the box. `BrowserWindow.loadFile('index.html')` serves your files from the `file://` protocol, and `fetch()` with relative paths resolves correctly against that base. This is the smoothest experience of any option — your existing code just works.

**localStorage**: Persists between sessions by default. Uses Chromium's standard localStorage implementation. The only gotcha: if you configure a non-persistent session partition, storage disappears on restart (but the default is persistent, so don't touch it).

**macOS features**: Full support. Menu bar, dock icon, DMG distribution via `electron-builder`, code signing, notarization, auto-updates. Electron is what VS Code, Slack, Discord, and Notion use on Mac.

**Gotchas**:
- Memory usage: ~200-300 MB at idle (it's a whole browser)
- Startup time: 1-2 seconds on mid-range hardware
- Node.js dependency for development (but not for the end user)
- `nodeIntegration` defaults to `false` for security; if you need Node APIs, use a preload script
- Annual Electron version churn (tied to Chromium releases)

**Verdict**: The "it just works" option. Overkill for a small app, but zero surprises. If you don't care about bundle size, this is the fastest path from "web app" to "Mac app."

---

### 2. Tauri 2.0 — The Lean Contender

**How it works**: Uses the OS-native WebView (WebKit/WKWebView on macOS) instead of bundling Chromium. The backend is a small Rust binary that manages the window and provides system APIs. Your HTML/CSS/JS runs in the system's WebKit engine.

**Bundle size**: Under 10 MB for a basic app (some reports say as low as 600 KB for the binary alone, though the full `.app` bundle with framework dependencies is typically 3-8 MB). That's 15-20x smaller than Electron.

**Setup for a vanilla JS app**: `create-tauri-app` has a vanilla HTML/CSS/JS template. However, you still need the Rust toolchain installed (`rustup`), and Tauri compiles a Rust binary as part of every build. The `tauri.conf.json` configuration points `frontendDist` (formerly `distDir`) to your static files folder. Setup: ~30 minutes including Rust installation.

**fetch() to local files**: This is where it gets interesting. Tauri serves your frontend via a custom `tauri://` protocol, not `http://` or `file://`. Standard `fetch()` with relative paths works for files inside your declared frontend directory. However, if your app expects an HTTP-like environment (cookies, certain CORS behaviors), you may need the `tauri-plugin-localhost` plugin, which spins up a local HTTP server. The plugin works but the Tauri team warns about security implications. For a simple app fetching local JSON, the default custom protocol should work fine.

**localStorage**: Works. WebKit's localStorage persists between sessions. The data lives in the app's WebKit data directory.

**macOS features**: Full support. Native `.app` bundles, DMG distribution, code signing, notarization, dock icon, menu bar. Since it uses the native WebView, rendering feels more "native" than Electron's.

**Gotchas**:
- Requires Rust toolchain (even though you write zero Rust for a simple wrapper)
- Build times: first build compiles Rust dependencies (~2-5 minutes). Subsequent builds are fast.
- WebKit rendering differences: your app was likely tested in Chrome/Firefox. WebKit may render some CSS differently (flexbox edge cases, font rendering). Test thoroughly.
- The `fetch()` compatibility with Tauri's custom protocol has been a source of GitHub issues. Simple relative-path fetches work, but complex fetch configurations (custom headers, specific CORS modes) may need the localhost plugin.
- Rust compile errors can be cryptic if you're not a Rust developer

**Verdict**: The best balance of size, performance, and features. The Rust toolchain requirement is the only real friction point. If you're comfortable installing `rustup`, this is the recommended option.

---

### 3. Neutralinojs — The Ultra-Lightweight Outsider

**How it works**: Similar to Tauri — uses the OS native WebView (WebKit on macOS). But instead of Rust, the backend is a lightweight C++ binary. No Chromium, no Node.js.

**Bundle size**: ~2 MB uncompressed, ~0.5 MB compressed. The smallest of all options by far.

**Setup for a vanilla JS app**: Install the `neu` CLI (`npm install -g @neutralinojs/neu` or download the binary). Run `neu create` to scaffold, then point it at your static files. Configuration lives in `neutralino.config.json`. Setup: ~10 minutes.

**fetch() to local files**: Works via the native WebView. Your files are served to the WebView and relative `fetch()` calls resolve.

**localStorage**: Has been reported to have issues specifically on macOS when running as a bundled `.app`. The storage feature works fine from the terminal but encounters problems inside Apple bundles. This is a significant concern for your app since localStorage is your persistence layer.

**macOS features**: Basic `.app` bundle support via the `--macos-bundle` CLI flag. But: no built-in auto-updater, no built-in installer/DMG creation, no code signing tooling, limited desktop integration. These are things you'd have to handle yourself.

**Gotchas**:
- Largely a single-developer hobby project with limited financial backing
- No built-in system for auto-updates
- No proper bundler like electron-builder for creating installers
- Limited desktop integration (no native notifications, limited menu bar control)
- The macOS localStorage bug is a potential showstopper for this specific app
- Smaller community = fewer Stack Overflow answers when things go wrong

**Verdict**: Tempting for its tiny size, but the localStorage issues on macOS and the limited distribution tooling make it risky for anything beyond a personal-use tool. Not recommended for this project.

---

### 4. PWA (Progressive Web App) — The Zero-Dependency Option

**How it works**: No wrapping at all. You add a `manifest.json` and a service worker to your existing web app, and browsers can "install" it as a standalone window. No separate runtime, no compilation.

**Bundle size**: Zero additional bytes (it's just your web app). The browser is the runtime.

**Setup**: Add a `manifest.json` file (app name, icons, display mode) and a service worker JS file (for offline caching). ~20 minutes of work. No build tools needed.

**fetch() to local files**: Here's the catch. PWAs still run in the browser, and "local files" means files served from your web server. You'd still need to serve the app via `python3 -m http.server` or similar. The PWA just gives you a standalone window — it doesn't bundle your files into a distributable package.

**localStorage**: Works perfectly (it's still a browser).

**macOS features**:
- **Chrome/Chromium**: Full PWA install support. Standalone window, dock icon, can be launched from Spotlight. Works well.
- **Safari**: Only supports "Add to Dock" (Safari 17+ / macOS Sonoma). This creates a shortcut but it's NOT a true standalone PWA install. The app still shows browser chrome, and you don't get a true standalone window. Safari's PWA support on macOS is still limited compared to Chrome.
- No DMG distribution (the user installs it from the browser)
- No code signing, no App Store distribution
- No auto-updater (just update the server and the service worker handles it)

**Gotchas**:
- Not a real "app" — it's a browser window in disguise
- Users must visit the URL first, then click "Install" (not intuitive for non-technical users)
- Safari's limited support means Mac users who use Safari (the default browser) get a second-class experience
- You still need a server running somewhere (can't just double-click an icon on an offline machine)
- No access to native APIs (file system, OS notifications beyond web push)

**Verdict**: The simplest approach if you just want a standalone-ish window and your users are technical enough to "install" from Chrome. But it doesn't solve the core problem — you still can't distribute a `.app` or `.dmg` file. It's a half-measure.

---

### 5. pywebview — The Python-Native Option

**How it works**: A Python library that opens a native WebView window (Cocoa/WebKit on macOS) and loads your HTML into it. Includes a built-in HTTP server for serving static files.

**Bundle size**: ~10-15 MB when bundled with py2app or PyInstaller. Much smaller than Electron, comparable to Tauri.

**Setup for a vanilla JS app**: Since this project already uses Python (for the PCGen migration pipeline), pywebview is a natural fit. A launcher script is ~10 lines of Python: `import webview; webview.create_window('3.5 Character Sheet', 'index.html'); webview.start()`. The built-in HTTP server handles static file serving. Setup: ~15 minutes.

**fetch() to local files**: Works out of the box. pywebview's built-in HTTP server serves your files over `http://localhost`, so `fetch()` with relative paths works exactly as it does in development.

**localStorage**: Works (it's WebKit's localStorage). Persists between sessions.

**macOS features**: Native window via Cocoa. Dock icon, window management, and basic menu bar. For distribution, use py2app to create a `.app` bundle. DMG creation requires separate tooling (create-dmg or similar). No built-in auto-updater. Code signing is possible but manual.

**Gotchas**:
- Requires Python to be bundled (py2app handles this, but adds to bundle size)
- py2app can be finicky with dependency detection — you may need to manually specify includes/excludes
- No official auto-update mechanism
- Smaller ecosystem than Electron or Tauri for desktop-specific features
- WebKit rendering (same caveat as Tauri — test for Safari/WebKit compatibility)
- PyInstaller bundles can accidentally include unnecessary libraries; use a virtual environment

**Verdict**: A surprisingly good fit for this specific project because Python is already in the toolchain. The built-in HTTP server solves the `fetch()` problem elegantly. If you want something quick and pragmatic without learning Rust, this is a strong second choice after Tauri.

---

### 6. Native Swift/WKWebView — The DIY Approach

**How it works**: Write a small Swift/SwiftUI macOS app that embeds a WKWebView and loads your HTML files from the app bundle. No framework, no runtime — just Apple's own tools.

**Bundle size**: Under 5 MB. The smallest distributable option (your app + the HTML/JS/CSS, and WebKit is part of macOS).

**Setup**: Requires Xcode. Create a new SwiftUI macOS App project, add an NSViewRepresentable wrapper for WKWebView (~30 lines of Swift), copy your web files into the Xcode project as bundle resources. Setup: ~30-60 minutes depending on Xcode familiarity.

**fetch() to local files**: This is the hard part. WKWebView's `loadFileURL` restricts access to a specific directory. You need to set the `allowingReadAccessTo` parameter to the directory containing your JSON files. Relative `fetch()` paths should work once this is configured correctly, but you may need to adjust paths or use a custom URL scheme handler for more complex scenarios.

**localStorage**: WKWebView supports localStorage, but persistence behavior depends on your WKWebsiteDataStore configuration. The default persistent store works, but if you're not careful, data can get cleared.

**macOS features**: It IS a native Mac app. Full menu bar, dock, notifications, App Store distribution, code signing, notarization — everything. The gold standard for macOS integration.

**Gotchas**:
- Requires Xcode (~12 GB download) and macOS development knowledge
- Swift/SwiftUI learning curve if you've never done Apple development
- WKWebView security restrictions can make `fetch()` to local files tricky
- JavaScript-to-Swift bridge requires explicit setup via `WKScriptMessageHandler`
- No cross-platform — this is macOS only (though that matches the requirement)
- Debugging WebView content requires Safari's Web Inspector (must be enabled manually)
- Every WKWebView update with macOS can subtly change behavior

**Verdict**: Maximum native quality, maximum setup effort. Only recommended if you want App Store distribution or already know Swift/Xcode.

---

### 7. Other Notable Mentions

**Gluon**: Uses the user's already-installed browser (Chrome or Firefox) rather than bundling one or using a WebView. App size under 1 MB. However, it's still experimental (started December 2022), requires Node.js/Bun/Deno, and has uncertain long-term support. Not recommended for production use.

**Nativefier**: Unmaintained as of 2023-2024. Was the go-to "one command to wrap a URL as an Electron app." The spiritual successor is **ToDesktop** (commercial SaaS) or just using Electron Forge directly. Skip Nativefier for new projects.

**Naty**: A nativefier alternative using system WebView. Under 7 MB. Very new, limited documentation. Interesting but not proven.

---

### The Recommendation Matrix

| Criterion | Electron | Tauri 2 | Neutralinojs | PWA | pywebview | Swift/WKWebView |
|---|---|---|---|---|---|---|
| Bundle size | 115-150 MB | 3-8 MB | ~2 MB | 0 (browser) | 10-15 MB | <5 MB |
| Setup time | 15 min | 30 min | 10 min | 20 min | 15 min | 30-60 min |
| fetch() works? | Yes | Yes* | Yes | Needs server | Yes (built-in server) | Tricky |
| localStorage? | Yes | Yes | Buggy on macOS | Yes | Yes | Yes (with care) |
| DMG distribution? | Yes (electron-builder) | Yes (built-in) | Manual | No | Manual (py2app) | Yes (Xcode) |
| New toolchain? | Node.js/npm | Rust | neu CLI | None | None (Python exists) | Xcode/Swift |
| Community size | Massive | Large & growing | Small | N/A | Medium | Apple's ecosystem |

*With default custom protocol; localhost plugin available if needed.

### The Bottom Line

**For this specific project (D&D 3.5 Character Sheet):**

1. **Best overall**: **Tauri 2.0** — Tiny bundle, native feel, great macOS support, and the fetch/localStorage story is solid for a simple static app. The Rust toolchain is the only friction, but it's a one-time install.

2. **Quickest pragmatic path**: **pywebview** — Python is already in the project toolchain. Ten lines of Python + py2app gives you a distributable `.app`. The built-in HTTP server means zero changes to the existing codebase.

3. **Safest/most proven**: **Electron** — If bundle size doesn't matter and you want the maximum ecosystem support, Electron is battle-tested. Your code works without any changes.

4. **Lightest touch**: **PWA** — If "runs in a standalone Chrome window" is good enough and you don't need to distribute a `.app` file, adding a manifest + service worker takes 20 minutes and changes nothing about how the app works.

The **anti-recommendations**: Skip Neutralinojs (localStorage bug on macOS is a dealbreaker). Skip Nativefier (dead project). Skip Gluon (too experimental). Skip native Swift unless you specifically want App Store distribution.

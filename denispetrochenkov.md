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
├── lib/
│   └── jszip.min.js    # Vendored JSZip 3.10.1 for ZIP export/import
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

## Phase 4: Tauri 2.0 Desktop Wrapper

### The Goal

Take the research from Phase 3 and actually wrap the app as a standalone macOS `.app` using Tauri 2.0 — our top recommendation. The key constraint: **zero changes to the web app itself**. The existing HTML/CSS/JS must work identically inside the Tauri WebView as it does in a browser.

### The 500MB Problem

The project root contains ~500MB+ of PCGen source data (`data/pcgen-6.08.00RC10/`), scraped web data (`data/www.realmshelps.net/`), Python migration scripts, screenshots, and markdown documentation. Tauri's `frontendDist` setting embeds everything in the target directory into the binary. If we pointed it at the project root, we'd ship a 500MB+ app for a 7MB web app.

**The solution**: A `beforeBuildCommand` that copies only the web assets (~7MB) to a clean `dist/` directory. This runs automatically before every `cargo tauri build`:

```sh
rm -rf dist && mkdir -p dist/js/ui dist/data/json
cp index.html dist/ && cp styles.css dist/
cp js/*.js dist/js/ && cp js/ui/*.js dist/js/ui/
cp data/json/*.json dist/data/json/
```

Result: a 9.8MB `.app` bundle instead of 500MB+.

### What We Created

All files live in `src-tauri/`:

- **`Cargo.toml`** — Rust manifest with `tauri v2`, `serde`, and `serde_json` dependencies. The crate type includes `staticlib`, `cdylib`, and `rlib` to support Tauri's build system.
- **`build.rs`** — One-liner: `tauri_build::build()`. This is Tauri's build script hook.
- **`src/main.rs`** — Desktop entry point (4 lines). Sets `windows_subsystem = "windows"` to hide the console on Windows, then calls `lib::run()`.
- **`src/lib.rs`** — App logic with a `print_page` Tauri command that calls `WebviewWindow::print()` for native print dialog support. The `generate_context!()` macro reads `tauri.conf.json` at compile time and embeds the frontend assets.
- **`tauri.conf.json`** — The real configuration hub (see below).
- **`capabilities/default.json`** — Security permissions for the main window. Just `core:default` since we don't need file system access or other native APIs.
- **`icons/`** — Generated via `cargo tauri icon` from a programmatically-created 256x256 PNG.

### The Configuration Deep Dive (`tauri.conf.json`)

```json
{
  "frontendDist": "../dist",     // Points to clean web-only copy
  "devUrl": "http://localhost:8000",  // Dev mode uses Python server
  "beforeDevCommand": "python3 -m http.server 8000",
  "beforeBuildCommand": "sh -c \"rm -rf dist && mkdir -p dist/js/ui dist/data/json && ...\"",
  "windows": [{ "title": "3.5 Character Sheet", "width": 1200, "height": 900 }],
  "security": {
    "csp": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'"
  }
}
```

The CSP (Content Security Policy) deserves explanation:
- `'self'` — allows loading resources from the app's own origin (the `tauri://localhost` protocol)
- `'unsafe-inline'` for styles — needed because the app uses inline styles and CSS-in-JS patterns
- `fonts.googleapis.com` / `fonts.gstatic.com` — Google Fonts used by the app
- `'unsafe-inline'` for scripts — the app uses inline event handlers and `<script>` tags

### Bugs We Hit

1. **`beforeBuildCommand` working directory**: The plan assumed the command ran from `src-tauri/` and used `cd ..` to reach the project root. Turns out Tauri runs it from the **project root** (parent of `src-tauri/`). The `cd ..` went one level too far, causing `cp: index.html: No such file or directory`. Fixed by removing `cd ..`.

2. **Missing app icon**: Tauri's `generate_context!()` macro expects `src-tauri/icons/icon.png` at compile time. Without it, compilation fails with a proc-macro panic. We generated a basic icon programmatically (a D20-inspired design via Python's `struct`/`zlib` modules) then ran `cargo tauri icon` to create all required variants (`.icns`, `.ico`, various PNG sizes).

3. **`window.print()` doesn't work in Tauri's WebView**: The web app used `window.print()` for its Print/PDF feature, but Tauri's WKWebView doesn't expose browser print from JS. Fixed by adding a Rust `print_page` command that calls `WebviewWindow::print()` (wry's native print API), exposed to JS via `withGlobalTauri: true`. The `pdfExport.js` detects `window.__TAURI__` and invokes the command, falling back to `window.print()` in browsers. This way the same code works in both environments.

### How to Use

**Development mode** (live reload from Python server):
```bash
cd src-tauri && cargo tauri dev
```

**Production build** (standalone `.app`):
```bash
cd src-tauri && cargo tauri build --bundles app
# Output: src-tauri/target/release/bundle/macos/3.5 Character Sheet.app
```

**Run the built app**:
```bash
open "src-tauri/target/release/bundle/macos/3.5 Character Sheet.app"
```

### Lessons Learned

- **Tauri's `generate_context!()` is a compile-time macro** — it reads `tauri.conf.json` and embeds your frontend assets into the Rust binary at compile time, not at runtime. This means your `frontendDist` directory must exist and be populated before `cargo build` runs (hence `beforeBuildCommand`).
- **First Rust compile is slow (~3-5 min)**, but incremental builds are fast (~20 sec). The Tauri CLI caches compiled dependencies in `src-tauri/target/`.
- **Tauri's custom protocol (`tauri://localhost`) handles `fetch()` seamlessly** for simple relative-path requests to local JSON files. No `tauri-plugin-localhost` needed.
- **`localStorage` works identically** in Tauri's WebKit WebView as in Safari. Data persists between app launches.
- **The `beforeBuildCommand` pattern is powerful** — it lets you maintain a clean separation between your full project (with dev tools, data sources, scripts) and the minimal set of files that ship in the app. Think of it as a poor man's build step for a no-build-step project.
- **Browser APIs aren't guaranteed in WebViews** — `window.print()` is a browser feature, not a WebView feature. When wrapping a web app in Tauri/Electron/etc., audit all browser API calls (`print`, `Notification`, `navigator.share`, etc.) and provide native alternatives. The pattern of checking `window.__TAURI__` for feature detection is clean and keeps the web app working in both contexts.

## Phase 5: Character Portrait & ZIP Export/Import

### The Goal

Add character portrait support and upgrade the export format from plain `.json` to `.zip` (containing the JSON + portrait image), while maintaining backward compatibility with old `.json` imports.

### The Design Decisions

**Why base64 data URLs for storage?** The portrait lives in `character.data.portrait` as a `data:image/png;base64,...` string. This keeps everything in a single JSON-serializable structure — no IndexedDB, no secondary storage, no complex async loading. The tradeoff is localStorage size, which is mitigated by resizing images to max 600x800 before storing (keeping the base64 string under ~150KB).

**Why ZIP instead of just embedding base64 in the JSON export?** Two reasons: (1) binary image data is much smaller in a zip than as a base64 string in JSON (~33% overhead for base64 encoding), and (2) it's a cleaner format — users can peek inside the zip to see `character.json` and `portrait.png` as separate, recognizable files.

**Why JSZip?** It's the de facto standard for client-side ZIP handling (10+ years old, 9k+ GitHub stars), works in all browsers, and is a single minified file (~98KB) that fits the project's `<script>` tag pattern with no build step needed.

**Why 3:4 aspect ratio?** Character portraits in tabletop RPGs follow the trading-card / portrait-photo convention. A 3:4 ratio (like 195x260px on screen) feels natural for a character portrait and mirrors what players expect from character art in published books and online tools. The portrait sits to the right of the Character Information fields, filling the vertical space of the card.

### What Changed

**New file**: `js/lib/jszip.min.js` — Vendored JSZip 3.10.1 library.

**`index.html`**: Added JSZip `<script>` tag before `storage.js` (it must load before the storage module that uses it). Changed the import file input `accept` from `.json` to `.json,.zip`.

**`js/character.js`**: Added `portrait: ''` to `createDefaultCharacter()` and a migration check in `migrateCharacterData()` for backward compat with old saves.

**`js/storage.js`** — The biggest change. `exportToFile()` became `async` and now:
1. Clones the character data, extracts the portrait base64 string, and clears the portrait from the JSON (no double-storing)
2. Creates a JSZip with `character.json` (clean, portrait-free)
3. If a portrait exists, decodes the base64 data URL and adds it as `portrait.png`/`.jpg` (binary, not base64)
4. Generates a zip blob and triggers download as `{Name}_Level{n}.zip`

`importFromFile()` now dispatches based on file extension: `.json` files go through the original JSON parser (backward compat), `.zip` files get extracted via JSZip. The ZIP import reads `character.json`, then looks for a `portrait.*` image file, converts it back to a base64 data URL, and merges it into the character data.

**`js/ui/characterTab.js`** — The portrait UI is a side-by-side layout inside the Character Information card:

The card content is wrapped in a `.char-info-with-portrait` flexbox container. The left column (`.char-info-column`) holds all the existing character fields (name, race, class, level, XP, size, alignment). The right column (`.portrait-section`) holds the portrait frame.

The portrait frame is 195px wide with `aspect-ratio: 3/4`, giving it a natural portrait-photo proportion. It has three states:
- **Empty**: Shows a dashed border with a placeholder icon and "Drop image here or click to browse" text
- **Has image**: Shows the portrait with `object-fit: cover` filling the frame. On hover, control buttons (change/remove) appear via a gradient overlay at the bottom
- **Drag over**: Golden glow border with a "Drop image" overlay, signaling the drop target

Interaction model:
- **Click empty frame** → opens file picker
- **Click portrait** → opens a full-screen lightbox with the image at full resolution
- **Drag and drop** an image file onto the frame → auto-resizes and sets as portrait
- **Hover controls** → camera button (change) and X button (remove) appear in a bottom gradient overlay
- **Lightbox** → click anywhere or press Escape to close

At 768px and below, the layout stacks vertically (portrait below the info fields) for mobile friendliness.

**`styles.css`**: Added styles for `.char-info-with-portrait` flexbox layout, `.portrait-frame` with aspect-ratio, `.portrait-dragover` state, `.portrait-drop-overlay`, `.portrait-controls` gradient hover overlay, `.portrait-lightbox` fullscreen overlay, and responsive breakpoint.

**`src-tauri/tauri.conf.json`**: Added `img-src 'self' data: blob:` to the CSP (needed for displaying base64 data URL images in the Tauri WebView). Updated `beforeBuildCommand` to include `js/lib/` in the dist copy.

### The Canvas Resize Trick

When a user uploads or drops a portrait, we resize it client-side using an HTML5 Canvas to a maximum of 600x800 (fitting the 3:4 ratio constraint):

```javascript
const MAX_W = 600, MAX_H = 800;
let w = img.naturalWidth, h = img.naturalHeight;
if (w > MAX_W || h > MAX_H) {
    const ratio = Math.min(MAX_W / w, MAX_H / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
}
const canvas = document.createElement('canvas');
canvas.width = w; canvas.height = h;
canvas.getContext('2d').drawImage(img, 0, 0, w, h);
const dataUrl = canvas.toDataURL('image/png', 0.85);
```

This ensures no 5MB DSLR photos end up in localStorage. The 600x800 max keeps the base64 string reasonable while providing enough resolution for the lightbox view.

### Drag and Drop Implementation

The drag-and-drop uses the standard HTML5 Drag and Drop API with careful event handling:
- `dragenter`/`dragover` → prevent default (required to make the element a valid drop target), add `.portrait-dragover` class and show the drop overlay
- `dragleave` → remove the visual feedback (but only when the pointer actually leaves the frame — child elements firing `dragleave` is the classic gotcha, handled by checking `relatedTarget`)
- `drop` → prevent default, extract `DataTransfer.files[0]`, validate it's an image type, then run through the same resize pipeline as the file picker

### Backward Compatibility

The import system handles three scenarios gracefully:
1. **`.zip` with portrait** — extracts both `character.json` and `portrait.png`, reconstitutes the base64 data URL
2. **`.zip` without portrait** — extracts `character.json` only, portrait stays empty
3. **`.json` (legacy)** — parsed directly, just like before. Old exports continue to work.

Old character saves in localStorage also work fine — `migrateCharacterData()` adds the empty `portrait` field on load.

### Lessons Learned

- **Base64 in JSON is fine for small data** — don't over-engineer with IndexedDB or Blob storage when a ~150KB string in localStorage does the job. The complexity cost of a secondary storage system vastly outweighs the storage efficiency gains for images this small.
- **ZIP is a great portable format for structured app data** — one file that contains both machine-readable data and human-inspectable assets. Users can open it and see what's inside.
- **Canvas is a free image processor** — need to resize, crop, or convert images client-side? Create a temporary canvas, draw to it, and call `toDataURL()`. No libraries needed.
- **CSP matters for data URLs** — if you're using base64 data URLs for images, your Content Security Policy must include `img-src data:`. This is easy to forget when the app works fine in a browser (no CSP by default) but breaks in Tauri/Electron.
- **Drag and drop has a `dragleave` gotcha** — when the pointer moves over a child element inside the drop zone, `dragleave` fires on the parent even though the pointer is still "inside." You need to either check `relatedTarget`, use a counter, or structure your DOM to avoid child elements during drag. We used the overlay approach — the drop overlay sits on top and intercepts the events.
- **Side-by-side layouts need responsive fallbacks** — a portrait that looks great at 1200px wide becomes cramped at 600px. The `@media (max-width: 768px)` breakpoint flips the flexbox to `column` direction, stacking the portrait below the info fields.
- **Lightbox is trivial with CSS** — a `position: fixed; inset: 0` overlay with a dark background and centered `max-width/max-height: 90%` image. Toggle via an `.active` class. No JS library needed.

## Phase 6: Native Save Dialog, Sample Character & Distribution

### The Goal

Three quality-of-life improvements for sharing the app with your D&D party: (1) export shows a native "Save As" dialog instead of auto-downloading, (2) a bundled sample character so new users see something in the Load dialog immediately, and (3) a cleaner upload icon for the portrait button.

### Native Save As Dialog (Tauri Plugins)

Previously, clicking Export silently dropped a `.zip` file into the user's Downloads folder via the browser's anchor-download trick (`a.href = blobURL; a.click()`). In a desktop app, this feels wrong — users expect to choose where files go.

**The solution**: Tauri's `dialog` and `fs` plugins. These expose OS-native dialogs and file system access to the JavaScript frontend.

**Rust side** (`src-tauri/`):
- `Cargo.toml` — Added `tauri-plugin-dialog = "2"` and `tauri-plugin-fs = "2"` dependencies
- `src/lib.rs` — Registered both plugins: `.plugin(tauri_plugin_dialog::init()).plugin(tauri_plugin_fs::init())`
- `capabilities/default.json` — Added `dialog:default`, `fs:default`, and `fs:allow-write-file` permissions

**JavaScript side** (`js/storage.js`):
The `exportToFile()` method now branches on `window.__TAURI__`:
- **Tauri path**: Generates the ZIP as a `Uint8Array` (not a blob), calls `__TAURI__.dialog.save()` for a native file picker, then `__TAURI__.fs.writeFile()` to write the bytes. If the user cancels the dialog (`save()` returns `null`), it returns early.
- **Browser path**: Falls back to the existing anchor-download, unchanged.

The `zip.generateAsync()` call takes a `type` parameter — `'uint8array'` for Tauri (which needs raw bytes for `writeFile`), `'blob'` for the browser (which needs a blob for `URL.createObjectURL`). Two separate calls rather than converting between types, because JSZip is efficient at generating either directly.

### Sample Character (First-Launch Seeding)

When a new user opens the app for the first time, there are zero saved characters. The Load dialog shows "No saved characters found." This is a terrible first impression.

**The solution**: A `data/sample_character.json` file containing a pre-built Tordek Ironforge (Dwarf Fighter 3). On first launch, if the character list is empty, the app fetches this file and saves it to localStorage.

**The character**: Tordek Ironforge is a classic D&D 3.5 pregen — Dwarf Fighter with 16 Str/13 Dex/18 Con (16 base + 2 racial)/10 Int/12 Wis/4 Cha (6 base - 2 racial). Three Fighter levels with HP rolls of 10, 7, 8. Feats: Power Attack, Cleave, Weapon Focus (Dwarven Waraxe). Equipped with scale mail, heavy steel shield, and a dwarven waraxe. Portrait embedded as a base64 data URL (the `data/hero.png` resized to 256px max dimension, ~131KB in base64).

**The seeding logic** (`js/app.js:seedSampleCharacter()`):
```javascript
async seedSampleCharacter() {
    if (characterStorage.getCharacterList().length > 0) return;
    const resp = await fetch('data/sample_character.json');
    if (!resp.ok) return;
    const importData = await resp.json();
    if (importData.data) characterStorage.saveCharacter(importData.data);
}
```

This runs before `loadLastCharacter()` in `init()`. Three guard clauses make it non-critical: skip if characters exist, skip if fetch fails, skip on parse error. The `try/catch` wrapper means a broken or missing sample file never prevents the app from starting.

The `beforeBuildCommand` in `tauri.conf.json` was updated to copy `data/sample_character.json` into the dist directory so it ships in the Tauri app bundle.

### Upload Arrow Icon

The portrait change button previously used 📷 (`&#x1F4F7;`) — a camera emoji. This is misleading because the button opens a file picker, not a camera. Changed to ⬆ (`&#x2B06;`) — an upload arrow — which matches the mental model of "upload an image file." The button's title attribute also changed from "Change portrait" to "Upload new portrait" for consistency.

### Distributing the macOS App to Your Party

**Simplest approach** — zip the `.app` bundle and share via Google Drive / Dropbox / Discord:
```bash
cd "src-tauri/target/release/bundle/macos"
zip -r "3.5_Character_Sheet.zip" "3.5 Character Sheet.app"
```

**Gatekeeper warning**: macOS will block unsigned apps downloaded from the internet. Recipients should: right-click → Open → click "Open" in the confirmation dialog. Or remove the quarantine flag: `xattr -cr "3.5 Character Sheet.app"`.

**DMG option**: For a more polished experience, build with `cargo tauri build --bundles dmg` (Tauri does this out of the box) or use `hdiutil create` manually.

### Lessons Learned

- **Plugin registration order matters in Tauri** — plugins must be registered with `.plugin()` before `.setup()` in the builder chain for their APIs to be available in the frontend.
- **`dialog.save()` returns `null` on cancel** — always check the return value before writing. This is cleaner than the browser's download approach where there's no way to detect a cancelled save.
- **First-launch seeding is a UX multiplier** — a single sample character transforms the experience from "empty app, now what?" to "oh, I see how this works." The cost is one 135KB JSON file and 10 lines of code.
- **`Uint8Array` vs `Blob`** — Tauri's `fs.writeFile()` expects a `Uint8Array`, while the browser's `URL.createObjectURL()` expects a `Blob`. JSZip can generate either directly, so don't convert between them.
- **Unsigned app distribution is fine for small groups** — code signing and notarization are important for public distribution, but for sharing with your D&D party, a zip file + "right-click → Open" instruction is plenty.

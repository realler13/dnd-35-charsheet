# D&D 3.5 Character Sheet

A complete web-based character sheet builder for D&D 3.5, featuring a comprehensive PCGen-sourced database with 1,419 spells, 786 classes, 146 feats, and more.

**Status**: ✅ Fully Implemented - Ready to Use!

## Quick Start

1. **Start the web server:**
   ```bash
   cd "/path/to/D&D 3.5 CharSheet"
   python3 -m http.server 8000
   ```

2. **Open in your browser:**
   ```
   http://localhost:8000
   ```

3. **Start creating your character!**

## Features

### Complete D&D 3.5 Database
- **1,419 spells** from PCGen RSRD
- **786 classes** (base and prestige)
- **163 skills** with ability linkage
- **146 feats** with prerequisites
- **111 weapons** with full stats
- **7 core races** (Human, Dwarf, Elf, Gnome, Half-Elf, Half-Orc, Halfling)

### Character Management
- Create, save, and load multiple characters
- Export/Import characters as JSON files
- Auto-save to browser storage (every 5 seconds)
- Character data persists across sessions

### Complete D&D 3.5 Implementation

#### Character Tab
- Real-time character sheet display
- Ability scores with modifiers
- Hit Points (HP) with wounds/subdual tracking
- Armor Class (Full, Flat-Footed, Touch)
- Initiative, BAB, and Attack bonuses
- Saving Throws (Fortitude, Reflex, Will)
- Movement speeds

#### Abilities Tab
- Six ability scores (STR, DEX, CON, INT, WIS, CHA)
- Racial bonuses and adjustments
- Level-up ability increases (every 4 levels)
- Magic, Misc, and Temp bonuses
- Point Buy calculator
- Real-time modifier calculations

#### Classes Tab
- Multiclass support (unlimited combinations)
- 786 classes from PCGen database
- Hit Die and HP tracking per level
- Skill points calculation (INT modifier bonus)
- BAB progression (Full/Good/Poor)
- Saving throw progression
- Class-specific features

#### Skills Tab
- Complete D&D 3.5 skill list (163 skills)
- Rank allocation per level
- Class vs Cross-Class skills
- Max ranks validation
- Skill point tracking (spent/remaining)
- Search and filter functionality
- Miscellaneous bonuses

#### Feats Tab
- 146 feats from PCGen RSRD
- Feat prerequisites displayed
- Feat type categorization
- Source references
- Search and filtering

#### Inventory Tab
- Wealth tracking (PP, GP, SP, CP)
- Experience Points with level progression
- Carrying capacity calculator
- Load status (Light/Medium/Heavy)
- Magic item slots (13 slots)
- Carried items management
- Automatic weight calculation
- 111 weapons database

#### Spells Tab
- 1,419 spells from PCGen database
- Spell list management (Levels 0-9)
- Spell slots by class and level
- Bonus spells from high ability scores
- Spell preparation tracking
- Spell DC calculation
- Casting ability selection (INT/WIS/CHA)
- Spell ranges (Close/Medium/Long)
- Full spell descriptions

#### Game Log Tab
- Adventure logging system
- Auto-logging (XP gains, wealth changes)
- Entry types (Combat, Level Up, etc.)
- Search and filter entries
- Timestamp tracking
- Manual entry support

## System Requirements

### Supported Browsers
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera
- Mobile browsers (iOS Safari, Chrome)

### Required Software
One of the following to run a local web server:

**Python** (recommended):
```bash
python3 -m http.server 8000
```

**Node.js**:
```bash
npx http-server -p 8000
```

**PHP**:
```bash
php -S localhost:8000
```

## How to Use

### Creating a New Character

1. Click **"New"** button in the header
2. Go to **Abilities Tab**:
   - Select your race from 7 core races
   - Set ability scores
3. Go to **Classes Tab**:
   - Add your first class level (choose from 786 classes)
   - Enter HP rolled
   - Skill points auto-calculate
4. Go to **Skills Tab**:
   - Allocate skill ranks (163 skills available)
   - Add miscellaneous bonuses
5. Go to **Feats Tab**:
   - Choose feats (146 available)
   - Prerequisites automatically checked
6. Go to **Inventory Tab** (optional):
   - Add starting wealth
   - Add equipment and weapons
7. Go to **Spells Tab** (for casters):
   - Set caster level
   - Choose casting ability
   - Add spells from 1,419 spell database
8. Click **"Save"** to save your character

### Managing Characters

**Save Character:**
- Click "Save" button
- Character saved to browser localStorage
- Auto-saves every 5 seconds

**Load Character:**
- Click "Load" button
- Select from list of saved characters
- Character data loads automatically

**Export Character:**
- Click "Export" button
- Downloads JSON file
- Use for backups or sharing

**Import Character:**
- Click "Import" button
- Select JSON file
- Character loads from file

## D&D 3.5 Rules Implemented

### Ability Scores
- Modifiers: (Score - 10) / 2, rounded down
- Racial bonuses apply
- Level-up bonuses: +1 every 4 levels

### Base Attack Bonus (BAB)
- **Full:** +1 per level (Fighter, Barbarian, Paladin, Ranger)
- **Good:** +0.75 per level (Cleric, Druid, Monk, Rogue, Bard)
- **Poor:** +0.5 per level (Wizard, Sorcerer)

### Saving Throws
- **Good:** 2 + (level / 2)
- **Poor:** level / 3

### Hit Points
- Level 1: Max HD + CON modifier
- After Level 1: HD roll + CON modifier (minimum 1)

### Skills
- **Class Skills:** Max ranks = Level + 3, costs 1 point per rank
- **Cross-Class Skills:** Max ranks = (Level + 3) / 2, costs 2 points per rank
- Level 1: (Class Skill Points + INT modifier) × 4
- After Level 1: Class Skill Points + INT modifier

### Armor Class
- AC = 10 + Armor + Shield + DEX mod + Size + Natural + Deflection + Misc
- **Touch AC:** Ignores armor, shield, natural armor
- **Flat-Footed AC:** Ignores DEX modifier

### Carrying Capacity
- Based on Strength score
- **Light Load:** No penalties
- **Medium Load:** -10 ft speed, Max DEX +3, -3 check penalty
- **Heavy Load:** -20 ft speed, Max DEX +1, -6 check penalty

### Spell Progression
- Based on class and level
- Bonus spells from high ability scores
- Spell DC = 10 + Spell Level + Casting Ability Modifier

## File Structure

```
D&D 3.5 CharSheet/
├── index.html              # Main HTML file
├── styles.css              # All styling
├── js/
│   ├── app.js             # Main application controller
│   ├── character.js       # Character data model
│   ├── calculator.js      # D&D 3.5 calculation engine
│   ├── dataLoader.js      # JSON data loading
│   ├── storage.js         # Save/load/export/import
│   └── ui/
│       ├── characterTab.js    # Character display
│       ├── abilitiesTab.js    # Abilities management
│       ├── classesTab.js      # Class selection
│       ├── skillsTab.js       # Skills system
│       ├── featsTab.js        # Feats system
│       ├── inventoryTab.js    # Inventory/wealth
│       ├── spellsTab.js       # Spell management
│       └── gameLogTab.js      # Game logging
├── data/
│   ├── json/              # 🆕 PCGen-sourced JSON database
│   │   ├── races.json         # 7 core races
│   │   ├── classes.json       # 786 classes
│   │   ├── skills.json        # 163 skills
│   │   ├── feats.json         # 146 feats
│   │   ├── spells.json        # 1,419 spells
│   │   └── weapons.json       # 111 weapons
│   ├── pcgen-6.08.00RC10/ # PCGen source data
│   └── old-data-archive/  # Archived legacy data
├── parsers/               # 🆕 LST file parsers
│   └── pcgen_lst_parser.py
├── transformers/          # 🆕 Data transformers
│   ├── races.py
│   ├── classes.py
│   ├── skills.py
│   ├── feats.py
│   ├── spells.py
│   └── equipment.py
├── tests/                 # 🆕 Unit tests
│   └── test_parsers.py
├── migrate_pcgen_to_json.py  # 🆕 Migration orchestrator
├── dev-archive/           # Development archive
├── README.md              # This file
├── MIGRATION.md           # 🆕 Migration documentation
└── COMPLETE_TESTING_CHECKLIST.md
```

## Data Sources

### Primary Database (NEW!)
All game data is now sourced from **PCGen 6.08.00RC10** and converted to JSON format for fast loading:

- **`data/json/races.json`** - 7 core races with full attributes
- **`data/json/classes.json`** - 786 classes (base, prestige, epic)
- **`data/json/skills.json`** - 163 skills with ability linkage
- **`data/json/feats.json`** - 146 feats with prerequisites
- **`data/json/spells.json`** - 1,419 spells with full details
- **`data/json/weapons.json`** - 111 weapons with complete stats

Each JSON file includes metadata:
- Source: PCGen RSRD 3.5e
- Version: 6.08.00RC10
- Generation timestamp
- Entry count

### Migration System
The project includes a complete migration system to convert PCGen LST files to JSON:

```bash
# Run full migration
python3 migrate_pcgen_to_json.py

# Migrate single category
python3 migrate_pcgen_to_json.py skills
```

See **MIGRATION.md** for detailed documentation.

## Development

### Architecture
- Pure JavaScript (ES6) - No frameworks required
- Modular component design
- Event-driven updates
- Reactive data model
- JSON-based data loading

### Key Classes
- **Character:** Data model and state management
- **Calculator:** D&D 3.5 rules engine
- **DataLoader:** JSON parsing and game data management
- **Storage:** LocalStorage and file I/O

### Making Changes

1. Edit files in `/js` directory
2. Refresh browser to see changes
3. No build process required

### Updating Game Data

To update or add game data from PCGen:

1. Place PCGen data in `data/pcgen-6.08.00RC10/`
2. Run migration: `python3 migrate_pcgen_to_json.py`
3. Updated JSON files generated in `data/json/`
4. Refresh browser to load new data

See **MIGRATION.md** for details.

## Troubleshooting

### Application won't load
- Check browser console (F12 → Console) for errors
- Ensure web server is running
- Try a different browser
- Clear browser cache and reload

### Data not saving
- Check browser localStorage is enabled
- Try Export/Import as backup method
- Check browser console for errors

### JSON files not loading
- Ensure running through web server (not file://)
- Check file paths are correct
- Verify JSON files exist in `/data/json/` folder
- Check browser console for fetch errors

### Calculations seem wrong
- Verify ability scores are correct
- Check racial bonuses applied
- Ensure all class levels added
- Refer to D&D 3.5 SRD for rules

## Testing

See `COMPLETE_TESTING_CHECKLIST.md` for comprehensive testing instructions including:
- Feature-by-feature testing
- Sample test characters
- Edge cases
- Calculation verification

## Credits

**Data Source:** PCGen 6.08.00RC10 - The PCGen project (http://pcgen.org/)
- RSRD 3.5e (Revised System Reference Document)
- Complete D&D 3.5 game data

**Original Concept:** Based on HeroForge Anew 3.5 Excel spreadsheet

**Development:** Converted to modern web application (2026)

## License

This is a fan-made tool for D&D 3.5 character management. D&D is owned by Wizards of the Coast. PCGen data is used under open gaming license (OGL).

## Version History

### Version 2.0.0 (January 2026) - PCGen Integration
- 🆕 Complete PCGen database integration (1,419 spells, 786 classes, 146 feats)
- 🆕 Unified JSON data format
- 🆕 Migration system for PCGen LST files
- 🆕 Feats tab with prerequisites
- 📈 Improved performance (JSON vs XML/CSV)
- 🗄️ Single source of truth for all game data

### Version 1.0.0 (January 2026)
- Complete implementation of all tabs
- Full D&D 3.5 rules engine
- Save/Load/Export/Import functionality
- Auto-save system
- Responsive design

---

**Enjoy creating your D&D 3.5 characters!** 🎲⚔️🐉

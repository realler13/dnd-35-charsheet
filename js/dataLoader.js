// dataLoader.js - CSV data loading and parsing system

class DataLoader {
    constructor() {
        this.gameData = {
            races: new Map(),
            classes: new Map(),
            skills: [],
            skillClassMatrix: new Map(),
            sizeModifiers: new Map(),
            experienceTables: [],
            carryingCapacity: new Map(),
            weapons: new Map(),
            abilityModifiers: new Map(),
            // NEW: Extended game data
            classSpecializations: new Map(),  // key: className, value: [specialization names]
            feats: new Map(),                  // key: featName, value: {name, type, prereqs, benefit, ...}
            flaws: new Map(),                  // key: flawName, value: {name, description, effect, ...}
            spells: new Map(),                 // key: spellName, value: {name, school, level, description, ...}
            spellsByClass: new Map(),          // key: className, value: Map(level => [spell names])
            items: new Map(),                  // key: itemName, value: {name, type, weight, cost, ...}
            equipment: new Map(),              // key: equipmentName, value: {...}
            languages: new Map()               // key: languageName, value: {name, type, speakers, description, free}
        };
    }

    // Parse CSV text into array of objects
    parseCSV(text) {
        const lines = text.split('\n');
        if (lines.length < 2) return [];

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const values = this.parseCSVLine(lines[i]);
            const row = {};

            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });

            data.push(row);
        }

        return data;
    }

    // Parse single CSV line handling quoted values
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values;
    }

    // Parse feat JSON data
    async loadFeatData() {
        try {
            const response = await fetch('data/json/feats.json');
            if (!response.ok) {
                console.warn('feats.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(feat => {
                this.gameData.feats.set(feat.name, {
                    name: feat.name,
                    type: feat.type || 'General',
                    source: feat.source || '',
                    description: feat.description || '',
                    prerequisite: feat.prerequisite || '',
                    benefit: feat.benefit || '',
                    normal: '',
                    special: feat.special || '',
                    choice: feat.choice || '',
                    multiple: feat.multiple || false,
                    fullText: ''
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} feats from JSON`);
        } catch (error) {
            console.error('Error loading feat data:', error);
        }
    }

    // Parse flaw JSON data
    async loadFlawData() {
        try {
            const response = await fetch('data/json/flaws.json');
            if (!response.ok) {
                console.warn('flaws.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(flaw => {
                this.gameData.flaws.set(flaw.name, {
                    name: flaw.name,
                    type: flaw.type || 'Flaw',
                    source: flaw.source || '',
                    description: flaw.description || '',
                    effect: flaw.effect || '',
                    prerequisite: flaw.prerequisite || '',
                    special: flaw.special || ''
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} flaws from JSON`);
        } catch (error) {
            console.error('Error loading flaws.json:', error);
        }
    }

    // Load languages from JSON
    async loadLanguageData() {
        try {
            const response = await fetch('data/json/languages.json');
            if (!response.ok) {
                console.warn('languages.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(lang => {
                this.gameData.languages.set(lang.name, {
                    name: lang.name,
                    type: lang.type || 'Standard',
                    typicalSpeakers: lang.typicalSpeakers || '',
                    script: lang.script || '',
                    description: lang.description || '',
                    free: lang.free || false  // Common is free
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} languages from JSON`);
        } catch (error) {
            console.error('Error loading languages.json:', error);
        }
    }

    // Parse spell JSON data
    async loadSpellData() {
        try {
            const response = await fetch('data/json/spells.json');
            if (!response.ok) {
                console.warn('spells.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(spell => {
                const spellData = {
                    name: spell.name,
                    school: spell.school || '',
                    descriptor: spell.descriptor || '',
                    levels: spell.levels || {}, // {Wizard: 3, Sorcerer: 3, ...}
                    components: spell.components || '',
                    castingTime: spell.castingTime || '',
                    range: spell.range || '',
                    target: spell.target || '',
                    duration: spell.duration || '',
                    savingThrow: spell.savingThrow || '',
                    spellResistance: spell.spellResistance || '',
                    description: spell.description || '',
                    fullText: spell.fullText || ''
                };

                this.gameData.spells.set(spell.name, spellData);

                // Build spellsByClass index
                Object.entries(spell.levels || {}).forEach(([className, level]) => {
                    if (!this.gameData.spellsByClass.has(className)) {
                        this.gameData.spellsByClass.set(className, new Map());
                    }
                    const classSpells = this.gameData.spellsByClass.get(className);
                    if (!classSpells.has(level)) {
                        classSpells.set(level, []);
                    }
                    classSpells.get(level).push(spell.name);
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} spells from JSON`);
        } catch (error) {
            console.error('Error loading spell data:', error);
        }
    }

    // Parse spell levels string like "Darkness 4, Sorcerer/Wizard 3" into {Darkness: 4, Sorcerer: 3, Wizard: 3}
    parseSpellLevels(levelText) {
        const levels = {};
        if (!levelText) return levels;

        const parts = levelText.split(',');
        parts.forEach(part => {
            const trimmed = part.trim();
            const match = trimmed.match(/(.+?)\s+(\d+)/);
            if (match) {
                const classNames = match[1];
                const level = parseInt(match[2]);

                // Handle "Sorcerer/Wizard" or "Cleric/Oracle"
                const classes = classNames.split('/');
                classes.forEach(className => {
                    levels[className.trim()] = level;
                });
            }
        });

        return levels;
    }

    // Parse item JSON data
    async loadItemData() {
        try {
            const response = await fetch('data/json/items.json');
            if (!response.ok) {
                console.warn('items.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(item => {
                // Store both magic items and equipment in same map
                if (item.type === 'Magic Item') {
                    this.gameData.items.set(item.name, {
                        name: item.name,
                        category: item.category || '',
                        subcategory: item.subcategory || '',
                        type: 'Magic Item',
                        casterLevel: item.casterLevel || 0,
                        price: item.price || item.cost || '',
                        cost: item.cost || 0,
                        weight: item.weight || 0,
                        description: item.description || ''
                    });
                } else {
                    // Equipment
                    this.gameData.equipment.set(item.name, {
                        name: item.name,
                        category: item.category || '',
                        subcategory: item.subcategory || '',
                        type: 'Equipment',
                        cost: item.cost || 0,
                        weight: item.weight || 0,
                        description: item.description || ''
                    });
                }
            });

            console.log(`Loaded ${this.gameData.items.size} magic items and ${this.gameData.equipment.size} equipment items from JSON`);
        } catch (error) {
            console.error('Error loading items.json:', error);
        }
    }

    // Load custom items (user-added items from non-OGL sources)
    async loadCustomItems() {
        try {
            const response = await fetch('data/json/custom_items.json');
            if (!response.ok) {
                console.log('No custom items file found (this is optional)');
                return;
            }

            const json = await response.json();
            let customCount = 0;

            json.data.forEach(item => {
                // Add to appropriate map based on type
                if (item.type === 'Magic Item') {
                    this.gameData.items.set(item.name, {
                        name: item.name,
                        category: item.category || '',
                        subcategory: item.subcategory || '',
                        type: 'Magic Item',
                        casterLevel: item.casterLevel || 0,
                        price: item.price || item.cost || '',
                        cost: item.cost || 0,
                        weight: item.weight || 0,
                        description: item.description || ''
                    });
                } else {
                    this.gameData.equipment.set(item.name, {
                        name: item.name,
                        category: item.category || '',
                        subcategory: item.subcategory || '',
                        type: 'Equipment',
                        cost: item.cost || 0,
                        weight: item.weight || 0,
                        description: item.description || ''
                    });
                }
                customCount++;
            });

            console.log(`Loaded ${customCount} custom items`);
        } catch (error) {
            console.log('No custom items loaded (optional)');
        }
    }

    // Remove loadEquipmentData - now combined with loadItemData

    // Parse cost string like "5 gp", "10 sp", "1 cp" into gold pieces
    parseCost(costText) {
        if (!costText) return 0;

        const match = costText.match(/([\d.]+)\s*(cp|sp|gp|pp)/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();

            switch(unit) {
                case 'pp': return value * 10;
                case 'gp': return value;
                case 'sp': return value / 10;
                case 'cp': return value / 100;
                default: return value;
            }
        }
        return 0;
    }

    // Load class specializations (hardcoded for D&D 3.5)
    async loadClassSpecializations() {
        // Use default specializations
        this.loadDefaultSpecializations();
        console.log(`Loaded specializations for ${this.gameData.classSpecializations.size} classes`);
    }

    // Load default class specializations (D&D 3.5 core rules)
    loadDefaultSpecializations() {
        this.gameData.classSpecializations.set('Wizard', [
            'Abjuration',
            'Conjuration',
            'Divination',
            'Enchantment',
            'Evocation',
            'Illusion',
            'Necromancy',
            'Transmutation',
            'Generalist'
        ]);

        this.gameData.classSpecializations.set('Cleric', [
            'Air Domain',
            'Animal Domain',
            'Chaos Domain',
            'Death Domain',
            'Destruction Domain',
            'Earth Domain',
            'Evil Domain',
            'Fire Domain',
            'Good Domain',
            'Healing Domain',
            'Knowledge Domain',
            'Law Domain',
            'Luck Domain',
            'Magic Domain',
            'Plant Domain',
            'Protection Domain',
            'Strength Domain',
            'Sun Domain',
            'Travel Domain',
            'Trickery Domain',
            'War Domain',
            'Water Domain'
        ]);

        this.gameData.classSpecializations.set('Druid', [
            'Air Domain',
            'Animal Domain',
            'Earth Domain',
            'Fire Domain',
            'Plant Domain',
            'Water Domain'
        ]);

        this.gameData.classSpecializations.set('Fighter', [
            'Weapon Master',
            'Defender',
            'Tactician'
        ]);

        this.gameData.classSpecializations.set('Ranger', [
            'Archery',
            'Two-Weapon Fighting',
            'Mounted Combat'
        ]);

        this.gameData.classSpecializations.set('Paladin', [
            'Divine Champion',
            'Holy Warrior',
            'Defender of the Faith'
        ]);

        console.log('Loaded default class specializations');
    }

    // Load all game data
    async loadAllData() {
        console.log('Loading game data...');

        try {
            await Promise.all([
                this.loadRaceData(),
                this.loadClassData(),
                this.loadSkillData(),
                this.loadCalcData(),
                this.loadTablesData(),
                this.loadWeaponData(),
                // loadCreatureData() removed — CSV adds ~500 monsters to the race dropdown.
                // JSON races (data/json/races.json) now has curated playable races only.
                // Load extended game data (all JSON now)
                this.loadFeatData(),
                this.loadFlawData(),
                this.loadSpellData(),
                this.loadItemData(),  // Now loads both items and equipment
                this.loadCustomItems(), // Load user custom items
                this.loadLanguageData(),
                this.loadClassSpecializations()
            ]);

            console.log('All game data loaded successfully');
            return this.gameData;
        } catch (error) {
            console.error('Error loading game data:', error);
            throw error;
        }
    }

    // Load race data from JSON
    async loadRaceData() {
        try {
            const response = await fetch('data/json/races.json');
            if (!response.ok) {
                console.warn('races.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(race => {
                // Extract favored class from racialTraits
                let favoredClass = '';
                if (race.racialTraits && Array.isArray(race.racialTraits)) {
                    for (const trait of race.racialTraits) {
                        const fcMatch = trait.match(/Favored Class:\s*([^.]+)/);
                        if (fcMatch) {
                            favoredClass = fcMatch[1].trim();
                            break;
                        }
                    }
                }
                // Fallback for core races with empty racialTraits
                if (!favoredClass) {
                    const coreFavored = {
                        'Human': 'Any', 'Elf': 'Wizard', 'Dwarf': 'Fighter',
                        'Halfling': 'Rogue', 'Gnome': 'Bard', 'Half-Elf': 'Any',
                        'Half-Orc': 'Barbarian'
                    };
                    favoredClass = coreFavored[race.name] || '';
                }

                this.gameData.races.set(race.name, {
                    name: race.name,
                    type: race.type || 'Humanoid',
                    subtype: race.subtype || '',
                    size: race.size || 'Medium',
                    landSpeed: race.landSpeed || 30,
                    flySpeed: race.flySpeed || 0,
                    climbSpeed: race.climbSpeed || 0,
                    swimSpeed: race.swimSpeed || 0,
                    str: race.str || 0,
                    dex: race.dex || 0,
                    con: race.con || 0,
                    int: race.int || 0,
                    wis: race.wis || 0,
                    cha: race.cha || 0,
                    senses: race.senses || '',
                    favoredClass: favoredClass
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} races from JSON`);
        } catch (error) {
            console.warn('Could not load races.json:', error.message);
        }
    }

    // Load creature data as fallback for races
    async loadCreatureData() {
        try {
            const response = await fetch('data/CreatureInfo.csv');
            const text = await response.text();
            const creatureData = this.parseCSV(text);

            creatureData.forEach(creature => {
                const raceName = creature.Race;
                if (raceName && raceName !== 'Select a Race/Creature' && raceName !== ' Custom Race' && !this.gameData.races.has(raceName)) {
                    this.gameData.races.set(raceName, {
                        name: raceName,
                        type: creature.Type || 'Humanoid',
                        subtype: creature.Subtype || '',
                        size: creature.Size || 'Medium',
                        landSpeed: parseInt(creature.Land) || 30,
                        flySpeed: parseInt(creature.Fly) || 0,
                        climbSpeed: parseInt(creature.Climb) || 0,
                        swimSpeed: parseInt(creature.Swim) || 0,
                        str: parseInt(creature.StrAdj) || 0,
                        dex: parseInt(creature.DexAdj) || 0,
                        con: parseInt(creature.ConAdj) || 0,
                        int: parseInt(creature.IntAdj) || 0,
                        wis: parseInt(creature.WisAdj) || 0,
                        cha: parseInt(creature.ChaAdj) || 0,
                        senses: [creature['LowLight Vision'], creature.Darkvision]
                            .filter(s => s && s !== 'normal')
                            .join(', ') || ''
                    });
                }
            });

            console.log(`Total races loaded: ${this.gameData.races.size}`);
        } catch (error) {
            console.error('Error loading CreatureInfo.csv:', error);
        }
    }

    // Load class data from JSON
    async loadClassData() {
        try {
            const response = await fetch('data/json/classes.json');
            if (!response.ok) {
                console.warn('classes.json not found, using defaults');
                this.loadDefaultClasses();
                return;
            }

            const json = await response.json();
            json.data.forEach(cls => {
                this.gameData.classes.set(cls.name, {
                    name: cls.name,
                    baseAttack: cls.baseAttack || 'Good',
                    hitDie: cls.hitDie || 8,
                    skillPoints: cls.skillPoints || 2,
                    fortSave: cls.fortSave || 'Poor',
                    reflexSave: cls.reflexSave || 'Poor',
                    willSave: cls.willSave || 'Poor',
                    skills: cls.skills || ''
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} classes from JSON`);
        } catch (error) {
            console.warn('Could not load classes.json:', error.message);
            this.loadDefaultClasses();
        }
    }

    // Load default classes
    loadDefaultClasses() {
        const defaultClasses = [
            { name: 'Barbarian', baseAttack: 'Full', hitDie: 12, skillPoints: 4, fortSave: 'Good', reflexSave: 'Poor', willSave: 'Poor' },
            { name: 'Bard', baseAttack: 'Good', hitDie: 6, skillPoints: 6, fortSave: 'Poor', reflexSave: 'Good', willSave: 'Good' },
            { name: 'Cleric', baseAttack: 'Good', hitDie: 8, skillPoints: 2, fortSave: 'Good', reflexSave: 'Poor', willSave: 'Good' },
            { name: 'Druid', baseAttack: 'Good', hitDie: 8, skillPoints: 4, fortSave: 'Good', reflexSave: 'Poor', willSave: 'Good' },
            { name: 'Fighter', baseAttack: 'Full', hitDie: 10, skillPoints: 2, fortSave: 'Good', reflexSave: 'Poor', willSave: 'Poor' },
            { name: 'Monk', baseAttack: 'Good', hitDie: 8, skillPoints: 4, fortSave: 'Good', reflexSave: 'Good', willSave: 'Good' },
            { name: 'Paladin', baseAttack: 'Full', hitDie: 10, skillPoints: 2, fortSave: 'Good', reflexSave: 'Poor', willSave: 'Poor' },
            { name: 'Ranger', baseAttack: 'Full', hitDie: 8, skillPoints: 6, fortSave: 'Good', reflexSave: 'Good', willSave: 'Poor' },
            { name: 'Rogue', baseAttack: 'Good', hitDie: 6, skillPoints: 8, fortSave: 'Poor', reflexSave: 'Good', willSave: 'Poor' },
            { name: 'Sorcerer', baseAttack: 'Poor', hitDie: 4, skillPoints: 2, fortSave: 'Poor', reflexSave: 'Poor', willSave: 'Good' },
            { name: 'Wizard', baseAttack: 'Poor', hitDie: 4, skillPoints: 2, fortSave: 'Poor', reflexSave: 'Poor', willSave: 'Good' }
        ];

        defaultClasses.forEach(cls => {
            this.gameData.classes.set(cls.name, cls);
        });

        console.log(`Loaded ${defaultClasses.length} default classes`);
    }

    // Load skill data from JSON
    async loadSkillData() {
        try {
            const response = await fetch('data/json/skills.json');
            if (!response.ok) {
                console.warn('skills.json not found, using defaults');
                return;
            }

            const json = await response.json();
            this.gameData.skills = json.data.map(skill => ({
                name: skill.name,
                ability: skill.ability,
                trained: skill.trained
            }));

            console.log(`Loaded ${json.metadata.entry_count} skills from JSON`);
        } catch (error) {
            console.warn('Could not load skills.json:', error.message);
        }

        // Create skill-class matrix
        this.createSkillClassMatrix();
    }

    // Create matrix of which skills are class skills for which classes
    createSkillClassMatrix() {
        const classSkills = {
            'Barbarian': ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Listen', 'Ride', 'Survival', 'Swim'],
            'Bard': ['Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy', 'Disguise', 'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (all)', 'Listen', 'Move Silently', 'Perform', 'Profession', 'Sense Motive', 'Sleight of Hand', 'Speak Language', 'Spellcraft', 'Swim', 'Tumble', 'Use Magic Device'],
            'Cleric': ['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (arcana)', 'Knowledge (history)', 'Knowledge (religion)', 'Knowledge (planes)', 'Profession', 'Spellcraft'],
            'Druid': ['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (nature)', 'Listen', 'Profession', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim'],
            'Fighter': ['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim'],
            'Monk': ['Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Hide', 'Jump', 'Knowledge (arcana)', 'Knowledge (religion)', 'Listen', 'Move Silently', 'Perform', 'Profession', 'Sense Motive', 'Spot', 'Swim', 'Tumble'],
            'Paladin': ['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (nobility)', 'Knowledge (religion)', 'Profession', 'Ride', 'Sense Motive'],
            'Ranger': ['Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Hide', 'Jump', 'Knowledge (dungeoneering)', 'Knowledge (geography)', 'Knowledge (nature)', 'Listen', 'Move Silently', 'Profession', 'Ride', 'Search', 'Spot', 'Survival', 'Swim', 'Use Rope'],
            'Rogue': ['Appraise', 'Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Knowledge (local)', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope'],
            'Sorcerer': ['Bluff', 'Concentration', 'Craft', 'Knowledge (arcana)', 'Profession', 'Spellcraft'],
            'Wizard': ['Concentration', 'Craft', 'Decipher Script', 'Knowledge (all)', 'Profession', 'Spellcraft']
        };

        Object.entries(classSkills).forEach(([className, skills]) => {
            this.gameData.skillClassMatrix.set(className, new Set(skills));
        });
    }

    // Load calculation data
    async loadCalcData() {
        // Size modifiers
        this.gameData.sizeModifiers.set('Fine', { ac: 8, grapple: -16, hide: 16 });
        this.gameData.sizeModifiers.set('Diminutive', { ac: 4, grapple: -12, hide: 12 });
        this.gameData.sizeModifiers.set('Tiny', { ac: 2, grapple: -8, hide: 8 });
        this.gameData.sizeModifiers.set('Small', { ac: 1, grapple: -4, hide: 4 });
        this.gameData.sizeModifiers.set('Medium', { ac: 0, grapple: 0, hide: 0 });
        this.gameData.sizeModifiers.set('Large', { ac: -1, grapple: 4, hide: -4 });
        this.gameData.sizeModifiers.set('Huge', { ac: -2, grapple: 8, hide: -8 });
        this.gameData.sizeModifiers.set('Gargantuan', { ac: -4, grapple: 12, hide: -12 });
        this.gameData.sizeModifiers.set('Colossal', { ac: -8, grapple: 16, hide: -16 });

        console.log('Loaded calculation data');
    }

    // Load tables data (experience, carrying capacity, etc.)
    async loadTablesData() {
        try {
            const response = await fetch('data/Tables.csv');
            const text = await response.text();
            const data = this.parseCSV(text);

            // Experience table (column headers: Select A Level, Experience Table)
            this.gameData.experienceTables = [];

            // Carrying capacity table (STR -> Light, Medium, Heavy, Lift, Drag)
            // The STR column in the CSV has an empty header, so we use a counter
            // since rows are in sequential STR order (1, 2, 3, ..., 29)
            let strScore = 0;
            data.forEach(row => {
                const light = parseInt(row['Light']);
                if (light > 0) {
                    strScore++;
                    this.gameData.carryingCapacity.set(strScore, {
                        light: light,
                        medium: parseInt(row['Medium']) || 0,
                        heavy: parseInt(row['Heavy']) || 0,
                        lift: parseInt(row['Lift']) || 0,
                        drag: parseInt(row['Drag']) || 0
                    });
                }
            });

            // Ability modifiers table
            for (let score = 1; score <= 60; score++) {
                const modifier = Math.floor((score - 10) / 2);
                this.gameData.abilityModifiers.set(score, modifier);
            }

            console.log('Loaded tables data');
        } catch (error) {
            console.error('Error loading Tables.csv:', error);
            this.loadDefaultTables();
        }
    }

    // Load default tables if CSV not available
    loadDefaultTables() {
        // Default experience table for levels 1-20
        this.gameData.experienceTables = [
            0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000,
            55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000
        ];

        // Default carrying capacity (simplified)
        const carryingData = [
            { str: 10, light: 33, medium: 66, heavy: 100, lift: 200, drag: 500 },
            { str: 12, light: 43, medium: 86, heavy: 130, lift: 260, drag: 650 },
            { str: 14, light: 58, medium: 116, heavy: 175, lift: 350, drag: 875 },
            { str: 16, light: 76, medium: 153, heavy: 230, lift: 460, drag: 1150 },
            { str: 18, light: 100, medium: 200, heavy: 300, lift: 600, drag: 1500 },
            { str: 20, light: 133, medium: 266, heavy: 400, lift: 800, drag: 2000 }
        ];

        carryingData.forEach(data => {
            this.gameData.carryingCapacity.set(data.str, data);
        });

        console.log('Loaded default tables');
    }

    // Load weapon data from JSON
    async loadWeaponData() {
        try {
            const response = await fetch('data/json/weapons.json');
            if (!response.ok) {
                console.warn('weapons.json not found');
                return;
            }

            const json = await response.json();
            json.data.forEach(weapon => {
                this.gameData.weapons.set(weapon.name, {
                    name: weapon.name,
                    category: weapon.category || '',
                    size: weapon.size || 'M',
                    damage: weapon.damage || '1d6',
                    critThreat: weapon.critThreat || 20,
                    critMult: weapon.critMult || 2,
                    range: weapon.range || 0,
                    weight: weapon.weight || 0,
                    cost: weapon.cost || 0,
                    type: weapon.type || 'B',
                    special: weapon.special || ''
                });
            });

            console.log(`Loaded ${json.metadata.entry_count} weapons from JSON`);
        } catch (error) {
            console.error('Error loading weapons.json:', error);
        }
    }

    // Get race data
    getRace(raceName) {
        return this.gameData.races.get(raceName);
    }

    // Get class data
    getClass(className) {
        return this.gameData.classes.get(className);
    }

    // Get all races
    getAllRaces() {
        return Array.from(this.gameData.races.values());
    }

    // Get all classes
    getAllClasses() {
        return Array.from(this.gameData.classes.values());
    }

    // Check if skill is class skill for given class
    isClassSkill(skillName, className) {
        const classSkills = this.gameData.skillClassMatrix.get(className);
        if (!classSkills) return false;

        // Handle "Knowledge (all)" pattern
        if (classSkills.has('Knowledge (all)') && skillName.startsWith('Knowledge')) {
            return true;
        }

        return classSkills.has(skillName);
    }
}

// Export singleton instance
const dataLoader = new DataLoader();

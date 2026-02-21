// character.js - Character data model and state management

class Character {
    constructor() {
        this.data = this.createDefaultCharacter();
        this.listeners = [];
    }

    // Create default character data structure
    createDefaultCharacter() {
        return {
            // Basic Info
            name: 'New Character',
            level: 1,
            race: 'Human',
            type: 'Humanoid',
            size: 'Medium',
            alignment: '',

            // Abilities (with tracking per level)
            abilities: {
                base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                racial: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
                levelUps: {}, // {4: 'str', 8: 'dex', etc}
                magic: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
                misc: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
                temp: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
            },

            // Classes (array for multiclassing)
            classes: [],

            // NEW: Feats
            feats: [],

            // NEW: Flaws
            flaws: [],

            // Skills (with ranks per level)
            skills: {},

            // Character-specific class skills (from feats like Skill Knowledge)
            characterClassSkills: [], // Array of skill names that are class skills for this character

            // Combat Stats
            combat: {
                hp: {
                    base: 0,
                    constitution: 0,
                    total: 0,
                    temporary: 0,
                    wounds: 0,
                    subdual: 0
                },
                ac: {
                    armor: 0,
                    shield: 0,
                    dex: 0,
                    natural: 0,
                    deflect: 0,
                    size: 0,
                    misc: 0,
                    temp: 0
                },
                initiative: {
                    dex: 0,
                    magic: 0,
                    misc: 0,
                    temp: 0
                },
                bab: 0,
                grapple: {
                    base: 0,
                    ability: 0,
                    size: 0,
                    magic: 0,
                    misc: 0,
                    temp: 0
                },
                melee: {
                    base: 0,
                    ability: 0,
                    size: 0,
                    magic: 0,
                    misc: 0,
                    temp: 0
                },
                ranged: {
                    base: 0,
                    ability: 0,
                    size: 0,
                    magic: 0,
                    misc: 0,
                    temp: 0
                },
                // Activated feat abilities
                activatedFeats: {
                    powerAttack: 0,        // Points traded from attack to damage
                    combatExpertise: 0     // Points traded from attack to AC
                }
            },

            // Saves
            saves: {
                fortitude: { base: 0, ability: 0, magic: 0, temp: 0 },
                reflex: { base: 0, ability: 0, magic: 0, temp: 0 },
                will: { base: 0, ability: 0, magic: 0, temp: 0 }
            },

            // Movement
            movement: {
                land: 30,
                climb: 0,
                swim: 0,
                fly: 0
            },

            // Resistances
            resistances: {
                damageReduction: '',
                fire: 0,
                electricity: 0,
                cold: 0,
                acid: 0,
                sonic: 0
            },

            // Inventory
            inventory: {
                wealth: { platinum: 0, gold: 0, silver: 0, copper: 0 },
                experience: 0,
                magicItems: {
                    head: null,
                    face: null,
                    neck: null,
                    shoulder: null,
                    arm: null,
                    torso: null,
                    hand: null,
                    leftRing: null,
                    rightRing: null,
                    armor: null,
                    body: null,
                    waist: null,
                    feet: null
                },
                carriedItems: [],
                totalWeight: 0
            },

            // Languages
            languages: [],

            // Spells
            spells: {
                casterLevel: 1,
                castingAbility: 'int', // 'int', 'wis', or 'cha'
                spellsByLevel: {
                    0: [], 1: [], 2: [], 3: [], 4: [],
                    5: [], 6: [], 7: [], 8: [], 9: []
                },
                preparedSpells: [],
                // NEW: Spell slot usage tracking
                slotsUsed: {
                    0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
                    5: 0, 6: 0, 7: 0, 8: 0, 9: 0
                }
            },

            // Game Log
            gameLog: [],

            // Racial Abilities
            racialAbilities: []
        };
    }

    // Initialize skills based on loaded data
    initializeSkills(skillsData) {
        this.data.skills = {};
        skillsData.forEach(skill => {
            this.data.skills[skill.name] = {
                ability: skill.ability,
                trained: skill.trained,
                ranks: Array(20).fill(0), // Ranks for each level 1-20
                bonus: 0,
                totalRanks: 0
            };
        });
    }

    // Get character data
    getData() {
        return this.data;
    }

    // Set character data
    setData(data) {
        this.data = data;
        this.migrateCharacterData(); // Ensure backwards compatibility
        this.notifyListeners();
    }

    // Update basic info
    updateBasicInfo(field, value) {
        this.data[field] = value;
        this.notifyListeners();
    }

    // Language management
    addLanguage(languageName) {
        const name = languageName.trim();
        if (!name) return false;

        // Check if already known
        if (this.data.languages.includes(name)) {
            return false;
        }

        // Check if we're at the limit (unless it's a free language like Common or a racial language)
        const isFree = (name === 'Common');
        const racialLanguages = this.getRacialLanguages();
        const isRacial = racialLanguages.includes(name);

        if (!isFree && !isRacial) {
            // Check if we have bonus language slots available
            const bonusLanguageCount = this.getBonusLanguageCount();
            const currentLanguages = this.data.languages.filter(lang =>
                lang !== 'Common' && !racialLanguages.includes(lang)
            );

            if (currentLanguages.length >= bonusLanguageCount) {
                return 'limit'; // Special return value to indicate limit reached
            }
        }

        this.data.languages.push(name);
        this.notifyListeners();
        return true;
    }

    removeLanguage(languageName) {
        const index = this.data.languages.indexOf(languageName);
        if (index > -1) {
            this.data.languages.splice(index, 1);
            this.notifyListeners();
            return true;
        }
        return false;
    }

    getLanguages() {
        return this.data.languages || [];
    }

    // Get bonus languages allowed based on INT modifier
    getBonusLanguageCount() {
        try {
            const stats = calculator.calculateAll(this.data);
            const intMod = stats.abilities.int.modifier;
            return Math.max(0, intMod); // INT modifier = bonus languages
        } catch (error) {
            console.error('Error calculating bonus languages:', error);
            // Fallback: calculate INT modifier manually
            const totalInt = (this.data.abilities.base.int || 10) +
                           (this.data.abilities.racial.int || 0) +
                           (this.data.abilities.magic.int || 0) +
                           (this.data.abilities.misc.int || 0);
            const intMod = Math.floor((totalInt - 10) / 2);
            return Math.max(0, intMod);
        }
    }

    // Get racial automatic languages from race data
    getRacialLanguages() {
        try {
            const race = dataLoader.gameData.races.get(this.data.race);
            if (!race || !race.automaticLanguages) {
                return [];
            }
            // Parse automatic languages (usually comma-separated string)
            if (typeof race.automaticLanguages === 'string') {
                return race.automaticLanguages.split(',').map(lang => lang.trim()).filter(lang => lang);
            }
            return race.automaticLanguages || [];
        } catch (error) {
            console.error('Error getting racial languages:', error);
            return [];
        }
    }

    // Add racial languages automatically
    addRacialLanguages() {
        const racialLangs = this.getRacialLanguages();
        let added = 0;
        racialLangs.forEach(lang => {
            if (this.addLanguage(lang)) {
                added++;
            }
        });
        return added;
    }

    // Update ability scores
    updateAbilityScore(category, ability, value) {
        this.data.abilities[category][ability] = parseFloat(value) || 0;
        this.notifyListeners();
    }

    // Add level-up ability increase
    addLevelUpAbility(level, ability) {
        this.data.abilities.levelUps[level] = ability;
        this.notifyListeners();
    }

    // Update race
    updateRace(raceName, raceData) {
        this.data.race = raceName;
        if (raceData) {
            this.data.type = raceData.type;
            this.data.size = raceData.size;
            this.data.movement.land = raceData.landSpeed;
            this.data.movement.climb = raceData.climbSpeed;
            this.data.movement.swim = raceData.swimSpeed;
            this.data.movement.fly = raceData.flySpeed;
            this.data.abilities.racial = {
                str: raceData.str,
                dex: raceData.dex,
                con: raceData.con,
                int: raceData.int,
                wis: raceData.wis,
                cha: raceData.cha
            };

            // Automatically add racial languages
            this.addRacialLanguages();
        }
        this.notifyListeners();
    }

    // Add class level
    addClass(levelNum, className, classData, hp, skillPoints) {
        this.data.classes[levelNum - 1] = {
            level: levelNum,
            className: className,
            hitDie: `d${classData.hitDie}`,
            hp: hp,
            skillPoints: skillPoints
        };
        this.updateLevel();
        this.notifyListeners();
    }

    // Remove class level
    removeClass(levelNum) {
        this.data.classes.splice(levelNum - 1, 1);
        this.updateLevel();
        this.notifyListeners();
    }

    // Update total level
    updateLevel() {
        this.data.level = this.data.classes.length;
    }

    // Update skill ranks
    updateSkillRanks(skillName, level, ranks) {
        if (this.data.skills[skillName]) {
            this.data.skills[skillName].ranks[level - 1] = parseInt(ranks) || 0;

            // Update total ranks
            this.data.skills[skillName].totalRanks = this.data.skills[skillName].ranks
                .slice(0, this.data.level)
                .reduce((sum, r) => sum + r, 0);

            this.notifyListeners();
        }
    }

    // Update skill bonus
    updateSkillBonus(skillName, bonus) {
        if (this.data.skills[skillName]) {
            this.data.skills[skillName].bonus = parseInt(bonus) || 0;
            this.notifyListeners();
        }
    }

    // Update combat stat component
    updateCombatStat(category, component, value) {
        this.data.combat[category][component] = parseFloat(value) || 0;
        this.notifyListeners();
    }

    // Update save component
    updateSave(save, component, value) {
        this.data.saves[save][component] = parseFloat(value) || 0;
        this.notifyListeners();
    }

    // Update wealth
    updateWealth(type, value) {
        const oldValue = this.data.inventory.wealth[type];
        this.data.inventory.wealth[type] = parseInt(value) || 0;

        // Auto-log ALL wealth changes (user preference)
        if (oldValue !== this.data.inventory.wealth[type]) {
            const diff = this.data.inventory.wealth[type] - oldValue;
            this.addGameLogEntry({
                type: 'wealth_change',
                message: `${diff > 0 ? 'Gained' : 'Lost'} ${Math.abs(diff)} ${type}`,
                details: { coinType: type, oldValue, newValue: this.data.inventory.wealth[type] }
            });
        }

        this.notifyListeners();
    }

    // Update experience
    updateExperience(value) {
        const oldXP = this.data.inventory.experience;
        this.data.inventory.experience = parseInt(value) || 0;

        // Auto-log ALL XP changes (user preference)
        if (oldXP !== this.data.inventory.experience) {
            const diff = this.data.inventory.experience - oldXP;
            this.addGameLogEntry({
                type: 'xp_gain',
                message: `${diff > 0 ? 'Gained' : 'Lost'} ${Math.abs(diff)} XP`,
                details: { oldXP, newXP: this.data.inventory.experience }
            });
        }

        this.notifyListeners();
    }

    // Add inventory item
    addInventoryItem(item) {
        this.data.inventory.carriedItems.push(item);
        this.updateInventoryWeight();
        this.notifyListeners();
    }

    // Remove inventory item
    removeInventoryItem(index) {
        this.data.inventory.carriedItems.splice(index, 1);
        this.updateInventoryWeight();
        this.notifyListeners();
    }

    // Update inventory item field
    updateInventoryItem(index, field, value) {
        if (this.data.inventory.carriedItems[index]) {
            this.data.inventory.carriedItems[index][field] = value;
            this.updateInventoryWeight();
            this.notifyListeners();
        }
    }

    // Update inventory weight
    updateInventoryWeight() {
        this.data.inventory.totalWeight = this.data.inventory.carriedItems
            .reduce((sum, item) => sum + ((parseFloat(item.weight) || 0) * (parseInt(item.quantity) || 1)), 0);
    }

    // Equip magic item
    equipMagicItem(slot, item) {
        this.data.inventory.magicItems[slot] = item;
        this.notifyListeners();
    }

    // Add spell
    addSpell(level, spell) {
        if (this.data.spells.spellsByLevel[level]) {
            this.data.spells.spellsByLevel[level].push(spell);
            this.notifyListeners();
        }
    }

    // Remove spell
    removeSpell(level, index) {
        if (this.data.spells.spellsByLevel[level]) {
            this.data.spells.spellsByLevel[level].splice(index, 1);
            this.notifyListeners();
        }
    }

    // Update caster level
    updateCasterLevel(value) {
        this.data.spells.casterLevel = parseInt(value) || 1;
        this.notifyListeners();
    }

    // Update casting ability
    updateCastingAbility(ability) {
        this.data.spells.castingAbility = ability; // 'int', 'wis', or 'cha'
        this.notifyListeners();
    }

    // Toggle spell prepared status
    toggleSpellPrepared(level, index, prepared) {
        if (this.data.spells.spellsByLevel[level] && this.data.spells.spellsByLevel[level][index]) {
            this.data.spells.spellsByLevel[level][index].prepared = prepared;
            this.updatePreparedSpellsList();
            this.notifyListeners();
        }
    }

    // Update prepared spells list
    updatePreparedSpellsList() {
        this.data.spells.preparedSpells = [];

        for (let level = 0; level <= 9; level++) {
            const spells = this.data.spells.spellsByLevel[level] || [];
            spells.forEach((spell, index) => {
                if (spell.prepared) {
                    this.data.spells.preparedSpells.push({
                        level,
                        index,
                        name: spell.name,
                        school: spell.school
                    });
                }
            });
        }
    }

    // NEW: Add feat
    addFeat(feat) {
        this.data.feats.push(feat);
        this.notifyListeners();
    }

    // NEW: Remove feat
    removeFeat(index) {
        this.data.feats.splice(index, 1);
        this.notifyListeners();
    }

    // NEW: Add flaw
    addFlaw(flaw) {
        this.data.flaws.push(flaw);
        this.notifyListeners();
    }

    // NEW: Remove flaw
    removeFlaw(index) {
        this.data.flaws.splice(index, 1);
        this.notifyListeners();
    }

    // NEW: Update class specialization
    updateClassSpecialization(levelNum, specialization) {
        if (this.data.classes[levelNum - 1]) {
            this.data.classes[levelNum - 1].specialization = specialization;
            this.notifyListeners();
        }
    }

    // NEW: Update spell slot usage
    updateSpellSlotUsage(level, used) {
        if (this.data.spells.slotsUsed.hasOwnProperty(level)) {
            this.data.spells.slotsUsed[level] = parseInt(used) || 0;
            this.notifyListeners();
        }
    }

    // NEW: Reset all spell slots
    resetSpellSlots() {
        for (let level = 0; level <= 9; level++) {
            this.data.spells.slotsUsed[level] = 0;
        }
        this.notifyListeners();
    }

    // NEW: Cast spell (use a slot)
    castSpell(level) {
        if (this.data.spells.slotsUsed.hasOwnProperty(level)) {
            this.data.spells.slotsUsed[level]++;
            this.notifyListeners();
        }
    }

    // NEW: Migrate old character data to new format (backwards compatibility)
    migrateCharacterData() {
        // Add feats array if missing
        if (!this.data.feats) {
            this.data.feats = [];
        }

        // Add flaws array if missing
        if (!this.data.flaws) {
            this.data.flaws = [];
        }

        // Add languages array if missing
        if (!this.data.languages) {
            this.data.languages = [];
        }

        // Add specialization to existing classes if missing
        if (this.data.classes) {
            this.data.classes.forEach(cls => {
                if (!cls.hasOwnProperty('specialization')) {
                    cls.specialization = null;
                }
            });
        }

        // Add spell slot usage if missing
        if (this.data.spells && !this.data.spells.slotsUsed) {
            this.data.spells.slotsUsed = {
                0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
                5: 0, 6: 0, 7: 0, 8: 0, 9: 0
            };
        }

        // Add source/itemId to inventory items if missing
        if (this.data.inventory && this.data.inventory.carriedItems) {
            this.data.inventory.carriedItems.forEach(item => {
                if (!item.hasOwnProperty('source')) {
                    item.source = 'custom';
                }
                if (!item.hasOwnProperty('itemId')) {
                    item.itemId = null;
                }
                if (!item.hasOwnProperty('cost')) {
                    item.cost = 0;
                }
                if (!item.hasOwnProperty('properties')) {
                    item.properties = {};
                }
            });
        }

        // Add source/spellId to spells if missing
        if (this.data.spells && this.data.spells.spellsByLevel) {
            for (let level = 0; level <= 9; level++) {
                const spells = this.data.spells.spellsByLevel[level] || [];
                spells.forEach(spell => {
                    if (!spell.hasOwnProperty('source')) {
                        spell.source = 'custom';
                    }
                    if (!spell.hasOwnProperty('spellId')) {
                        spell.spellId = null;
                    }
                });
            }
        }
    }

    // Add game log entry
    addGameLogEntry(entry) {
        this.data.gameLog.push({
            ...entry,
            timestamp: new Date().toISOString()
        });
        this.notifyListeners();
    }

    // Add change listener
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove change listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    // Notify all listeners of changes
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.data));
    }

    // Export character to JSON
    exportToJSON() {
        return JSON.stringify({
            version: '1.0',
            data: this.data
        }, null, 2);
    }

    // Import character from JSON
    importFromJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.data) {
                this.data = imported.data;
                this.migrateCharacterData(); // Ensure backwards compatibility
                this.notifyListeners();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing character:', error);
            return false;
        }
    }
}

// Export singleton instance
const character = new Character();

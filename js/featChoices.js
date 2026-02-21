// featChoices.js - Defines which feats require choices and what options are available

const FEAT_CHOICE_TYPES = {
    SKILL: 'skill',
    WEAPON: 'weapon',
    SCHOOL: 'school',
    CREATURE_TYPE: 'creature_type',
    ENERGY_TYPE: 'energy_type',
    SPELL: 'spell',
    DOMAIN: 'domain'
};

// Feats that require a choice to be made
const FEAT_CHOICES = {
    // Skill-based feats
    'Skill Focus': {
        type: FEAT_CHOICE_TYPES.SKILL,
        label: 'Choose Skill',
        getOptions: () => {
            return dataLoader.gameData.skills.map(skill => skill.name).sort();
        }
    },

    // Weapon-based feats
    'Weapon Focus': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Weapon',
        getOptions: () => {
            // Get all weapons from database
            const weapons = Array.from(dataLoader.gameData.weapons.keys()).sort();
            // Add common weapon groups
            return [
                ...weapons,
                'Ray (ranged touch attacks)',
                'Grapple',
                'Unarmed Strike'
            ];
        }
    },

    'Weapon Specialization': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Weapon',
        getOptions: () => {
            const weapons = Array.from(dataLoader.gameData.weapons.keys()).sort();
            return [
                ...weapons,
                'Ray (ranged touch attacks)',
                'Grapple',
                'Unarmed Strike'
            ];
        }
    },

    'Improved Critical': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Weapon',
        getOptions: () => {
            return Array.from(dataLoader.gameData.weapons.keys()).sort();
        }
    },

    'Greater Weapon Focus': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Weapon',
        getOptions: () => {
            const weapons = Array.from(dataLoader.gameData.weapons.keys()).sort();
            return [...weapons, 'Ray (ranged touch attacks)', 'Grapple', 'Unarmed Strike'];
        }
    },

    'Greater Weapon Specialization': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Weapon',
        getOptions: () => {
            const weapons = Array.from(dataLoader.gameData.weapons.keys()).sort();
            return [...weapons, 'Ray (ranged touch attacks)', 'Grapple', 'Unarmed Strike'];
        }
    },

    // Spell school feats
    'Spell Focus': {
        type: FEAT_CHOICE_TYPES.SCHOOL,
        label: 'Choose School',
        getOptions: () => {
            return [
                'Abjuration',
                'Conjuration',
                'Divination',
                'Enchantment',
                'Evocation',
                'Illusion',
                'Necromancy',
                'Transmutation'
            ];
        }
    },

    'Greater Spell Focus': {
        type: FEAT_CHOICE_TYPES.SCHOOL,
        label: 'Choose School',
        getOptions: () => {
            return [
                'Abjuration',
                'Conjuration',
                'Divination',
                'Enchantment',
                'Evocation',
                'Illusion',
                'Necromancy',
                'Transmutation'
            ];
        }
    },

    // Creature type feats
    'Favored Enemy': {
        type: FEAT_CHOICE_TYPES.CREATURE_TYPE,
        label: 'Choose Creature Type',
        getOptions: () => {
            return [
                'Aberration',
                'Animal',
                'Construct',
                'Dragon',
                'Elemental',
                'Fey',
                'Giant',
                'Humanoid (aquatic)',
                'Humanoid (dwarf)',
                'Humanoid (elf)',
                'Humanoid (goblinoid)',
                'Humanoid (gnoll)',
                'Humanoid (gnome)',
                'Humanoid (halfling)',
                'Humanoid (human)',
                'Humanoid (orc)',
                'Humanoid (reptilian)',
                'Magical Beast',
                'Monstrous Humanoid',
                'Ooze',
                'Outsider (air)',
                'Outsider (chaotic)',
                'Outsider (earth)',
                'Outsider (evil)',
                'Outsider (fire)',
                'Outsider (good)',
                'Outsider (lawful)',
                'Outsider (water)',
                'Plant',
                'Undead',
                'Vermin'
            ];
        }
    },

    // Energy type feats
    'Energy Substitution': {
        type: FEAT_CHOICE_TYPES.ENERGY_TYPE,
        label: 'Choose Energy Type',
        getOptions: () => {
            return ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'];
        }
    },

    // Domain feats (for clerics)
    'Extra Turning': {
        type: FEAT_CHOICE_TYPES.DOMAIN,
        label: 'Note',
        getOptions: () => [],
        note: 'Grants 4 extra daily turning attempts'
    },

    // Skill Knowledge - choose 2 skills to make class skills
    'Skill Knowledge': {
        type: FEAT_CHOICE_TYPES.SKILL,
        label: 'Choose 2 Skills',
        multiSelect: true,
        maxSelections: 2,
        getOptions: () => {
            return dataLoader.gameData.skills.map(skill => skill.name).sort();
        },
        note: 'Choose any two skills. They become class skills for you.'
    },

    // Weapon proficiency feats
    'Exotic Weapon Proficiency': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Exotic Weapon',
        getOptions: () => {
            const weapons = Array.from(dataLoader.gameData.weapons.values())
                .filter(w => w.proficiency === 'Exotic' || w.category === 'Exotic')
                .map(w => w.name)
                .sort();
            // Fallback: if filtering yields nothing, show all weapons
            return weapons.length > 0 ? weapons : Array.from(dataLoader.gameData.weapons.keys()).sort();
        }
    },

    'Martial Weapon Proficiency': {
        type: FEAT_CHOICE_TYPES.WEAPON,
        label: 'Choose Martial Weapon',
        getOptions: () => {
            const weapons = Array.from(dataLoader.gameData.weapons.values())
                .filter(w => w.proficiency === 'Martial' || w.category === 'Martial')
                .map(w => w.name)
                .sort();
            return weapons.length > 0 ? weapons : Array.from(dataLoader.gameData.weapons.keys()).sort();
        }
    }
};

// Helper function to check if a feat requires a choice
function featRequiresChoice(featName) {
    return featName in FEAT_CHOICES;
}

// Helper function to get choice info for a feat
function getFeatChoiceInfo(featName) {
    return FEAT_CHOICES[featName] || null;
}

// Helper function to format feat name with choice
function formatFeatName(featName, choice) {
    if (!choice) return featName;
    return `${featName} (${choice})`;
}

// Auto-detect if a feat needs a choice based on its benefit/description text.
// Used as a fallback when a feat isn't in FEAT_CHOICES.
function detectFeatChoices(featData) {
    if (!featData) return null;

    const text = ((featData.benefit || '') + ' ' + (featData.description || '')).toLowerCase();

    // Weapon choice patterns
    if (/choose\s+(one\s+)?type\s+of\s+weapon/i.test(text) ||
        /select\s+(a|one)\s+weapon/i.test(text) ||
        /pick\s+(a|one)\s+weapon/i.test(text) ||
        /applies\s+to\s+one\s+weapon/i.test(text)) {
        return {
            type: FEAT_CHOICE_TYPES.WEAPON,
            label: 'Choose Weapon',
            getOptions: () => Array.from(dataLoader.gameData.weapons.keys()).sort(),
            autoDetected: true
        };
    }

    // Skill choice patterns
    if (/choose\s+(a|one)\s+skill/i.test(text) ||
        /select\s+(a|one)\s+skill/i.test(text) ||
        /pick\s+(a|one)\s+skill/i.test(text) ||
        /applies\s+to\s+one\s+skill/i.test(text)) {
        return {
            type: FEAT_CHOICE_TYPES.SKILL,
            label: 'Choose Skill',
            getOptions: () => dataLoader.gameData.skills.map(s => s.name).sort(),
            autoDetected: true
        };
    }

    // School of magic choice patterns
    if (/choose\s+(a|one)\s+school\s+of\s+magic/i.test(text) ||
        /select\s+(a|one)\s+school/i.test(text) ||
        /pick\s+(a|one|an?)\s+(arcane\s+)?school/i.test(text)) {
        return {
            type: FEAT_CHOICE_TYPES.SCHOOL,
            label: 'Choose School',
            getOptions: () => [
                'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
                'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
            ],
            autoDetected: true
        };
    }

    // Energy type choice patterns
    if (/choose\s+(a|one)\s+energy\s+type/i.test(text) ||
        /select\s+(a|one)\s+(type\s+of\s+)?energy/i.test(text)) {
        return {
            type: FEAT_CHOICE_TYPES.ENERGY_TYPE,
            label: 'Choose Energy Type',
            getOptions: () => ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'],
            autoDetected: true
        };
    }

    return null;
}

// Extended lookup: check FEAT_CHOICES first, then fall back to auto-detection
function getFeatChoiceInfoExtended(featName, featData) {
    const explicit = FEAT_CHOICES[featName];
    if (explicit) return explicit;
    return detectFeatChoices(featData);
}

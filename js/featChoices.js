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

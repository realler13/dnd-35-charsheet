// featParser.js - Parse feat benefit text to extract mechanical bonuses

/**
 * Parse a feat's benefit text and extract all automatable bonuses
 * @param {Object} featData - Feat data from database (must include benefit text)
 * @param {string} choice - Optional choice for parameterized feats (skill name, weapon, etc.)
 * @returns {Object} Parsed bonuses structure
 */
function parseFeatBenefits(featData, choice = null) {
    const result = {
        saves: { fortitude: 0, reflex: 0, will: 0 },
        hp: 0,
        initiative: 0,
        skills: {}, // skill name -> bonus
        attack: {}, // weapon name -> bonus
        damage: {}, // weapon name -> bonus
        ac: 0,
        special: [], // Special effects that can't be automated
        category: null, // Feat category (automatic, manual, informational, spell)
        description: null // Human-readable category description
    };

    const benefit = featData.benefit || '';
    const name = featData.name || '';
    const type = featData.type || '';

    if (!benefit) return result;

    const lowerBenefit = benefit.toLowerCase();
    const lowerName = name.toLowerCase();

    // Categorize feat first
    result.category = categorizeFeat(name, type, benefit);
    result.description = getFeatCategoryDescription(result.category);

    // Pattern 1: Saving throw bonuses "+2 bonus on Fortitude saves"
    const savePattern = /\+(\d+)\s+(?:bonus\s+)?(?:on|to)\s+(?:all\s+)?(\w+)\s+sav(?:e|ing throw)/gi;
    let saveMatch;
    while ((saveMatch = savePattern.exec(lowerBenefit)) !== null) {
        const bonus = parseInt(saveMatch[1]);
        const saveType = saveMatch[2].toLowerCase();

        if (saveType.includes('fortitude') || saveType.includes('fort')) {
            result.saves.fortitude += bonus;
        } else if (saveType.includes('reflex') || saveType.includes('ref')) {
            result.saves.reflex += bonus;
        } else if (saveType.includes('will')) {
            result.saves.will += bonus;
        }
    }

    // Pattern 2: HP bonuses "+3 hit points"
    const hpPattern = /\+(\d+)\s+hit\s+points?/gi;
    const hpMatch = hpPattern.exec(lowerBenefit);
    if (hpMatch) {
        result.hp = parseInt(hpMatch[1]);
    }

    // Special case: Toughness scales with level
    if (name === 'Toughness') {
        result.special.push({
            type: 'toughness_scaling',
            description: '+3 HP at levels 1-3, then +1 per level'
        });
    }

    // Pattern 3: Initiative bonuses "+4 bonus on initiative"
    const initPattern = /\+(\d+)\s+(?:bonus\s+)?(?:on|to)\s+initiative/gi;
    const initMatch = initPattern.exec(lowerBenefit);
    if (initMatch) {
        result.initiative = parseInt(initMatch[1]);
    }

    // Pattern 4: Skill bonuses "+2 bonus on Jump checks and Tumble checks"
    // This handles both single skills and pairs
    const skillPattern = /\+(\d+)\s+bonus\s+on\s+(?:all\s+)?(.+?)\s+checks?\s*(?:and\s+(.+?)\s+checks?)?(?:\.|,|$)/gi;
    let skillMatch;
    while ((skillMatch = skillPattern.exec(benefit)) !== null) {
        const bonus = parseInt(skillMatch[1]);
        const skill1Raw = skillMatch[2];
        const skill2Raw = skillMatch[3];

        // Parse first skill
        if (skill1Raw) {
            const skill1 = parseSkillName(skill1Raw);
            if (skill1) {
                result.skills[skill1] = (result.skills[skill1] || 0) + bonus;
            }
        }

        // Parse second skill if present
        if (skill2Raw) {
            const skill2 = parseSkillName(skill2Raw);
            if (skill2) {
                result.skills[skill2] = (result.skills[skill2] || 0) + bonus;
            }
        }
    }

    // Pattern 5: Skill Focus - "+3 bonus on all checks with one skill"
    if (name === 'Skill Focus' && choice) {
        result.skills[choice] = (result.skills[choice] || 0) + 3;
    }

    // Pattern 6: Epic Skill Focus - "+10 bonus to one skill"
    if (name === 'Epic Skill Focus' && choice) {
        result.skills[choice] = (result.skills[choice] || 0) + 10;
    }

    // Pattern 7: Combat Casting - "+4 on Concentration checks"
    const concentrationPattern = /\+(\d+)\s+(?:bonus\s+)?on\s+Concentration\s+checks/gi;
    const concMatch = concentrationPattern.exec(benefit);
    if (concMatch) {
        result.skills['Concentration'] = (result.skills['Concentration'] || 0) + parseInt(concMatch[1]);
    }

    // Pattern 8: Weapon Focus/Specialization
    if (name === 'Weapon Focus' && choice) {
        result.attack[choice] = (result.attack[choice] || 0) + 1;
    } else if (name === 'Greater Weapon Focus' && choice) {
        result.attack[choice] = (result.attack[choice] || 0) + 1;
    } else if (name === 'Epic Weapon Focus' && choice) {
        result.attack[choice] = (result.attack[choice] || 0) + 2;
    } else if (name === 'Weapon Specialization' && choice) {
        result.damage[choice] = (result.damage[choice] || 0) + 2;
    } else if (name === 'Greater Weapon Specialization' && choice) {
        result.damage[choice] = (result.damage[choice] || 0) + 2;
    } else if (name === 'Epic Weapon Specialization' && choice) {
        result.damage[choice] = (result.damage[choice] || 0) + 4;
    }

    // Pattern 9: AC bonuses "+2 bonus to AC"
    const acPattern = /\+(\d+)\s+(?:bonus\s+)?(?:on|to)\s+(?:AC|Armor Class|armor class)/gi;
    const acMatch = acPattern.exec(benefit);
    if (acMatch) {
        result.ac = parseInt(acMatch[1]);
    }

    // Pattern 10: Improved Grapple "+4 bonus on grapple checks"
    if (lowerBenefit.includes('grapple')) {
        const grapplePattern = /\+(\d+)\s+(?:bonus\s+)?on\s+grapple\s+checks/gi;
        const grappleMatch = grapplePattern.exec(benefit);
        if (grappleMatch) {
            result.skills['Grapple'] = (result.skills['Grapple'] || 0) + parseInt(grappleMatch[1]);
        }
    }

    // Pattern 11: Spell Penetration - caster level checks
    if (name === 'Spell Penetration') {
        result.special.push({
            type: 'spell_penetration',
            bonus: 2,
            description: '+2 on caster level checks to overcome spell resistance'
        });
    } else if (name === 'Greater Spell Penetration') {
        result.special.push({
            type: 'spell_penetration',
            bonus: 2,
            description: '+2 on caster level checks to overcome spell resistance (stacks with Spell Penetration)'
        });
    } else if (name === 'Epic Spell Penetration') {
        result.special.push({
            type: 'spell_penetration',
            bonus: 2,
            description: '+2 on caster level checks to overcome spell resistance (stacks)'
        });
    }

    // Special case: Skill Knowledge - makes 2 skills class skills
    if (name === 'Skill Knowledge') {
        result.special.push({
            type: 'class_skill_change',
            description: 'Choose two skills to become class skills',
            requires_ui: true
        });
    }

    // Special case: Open Minded - grants skill points
    if (name === 'Open Minded') {
        result.special.push({
            type: 'skill_points',
            bonus: 5,
            description: 'Gain 5 additional skill points'
        });
    }

    // Metamagic feats - document their effects
    const metamagicFeats = {
        'Empower Spell': { slotIncrease: 2, description: 'Spell effects increased by 50%' },
        'Maximize Spell': { slotIncrease: 3, description: 'All variable effects maximized' },
        'Quicken Spell': { slotIncrease: 4, description: 'Cast as free action' },
        'Widen Spell': { slotIncrease: 3, description: 'Double spell area' },
        'Extend Spell': { slotIncrease: 1, description: 'Double spell duration' },
        'Enlarge Spell': { slotIncrease: 1, description: 'Double spell range' },
        'Heighten Spell': { slotIncrease: 'variable', description: 'Increase spell level' },
        'Silent Spell': { slotIncrease: 1, description: 'No verbal components' },
        'Still Spell': { slotIncrease: 1, description: 'No somatic components' },
        'Persistent Spell': { slotIncrease: 6, description: 'Lasts 24 hours' }
    };

    if (metamagicFeats[name]) {
        const metamagic = metamagicFeats[name];
        result.special.push({
            type: 'metamagic',
            slotIncrease: metamagic.slotIncrease,
            description: `${metamagic.description}. Spell slot level +${metamagic.slotIncrease}.`,
            requires_spell_system: true
        });
    }

    // Power Attack and Combat Expertise - document manual tracking
    if (name === 'Power Attack') {
        result.special.push({
            type: 'activated_ability',
            description: 'Trade attack bonus for damage (up to BAB). Use combat controls to activate.',
            requires_ui: false
        });
    }

    if (name === 'Combat Expertise') {
        result.special.push({
            type: 'activated_ability',
            description: 'Trade attack bonus for AC (up to BAB). Use combat controls to activate.',
            requires_ui: false
        });
    }

    // Epic Toughness
    if (name === 'Epic Toughness') {
        result.hp = 30;
    }

    // Epic save feats
    if (name === 'Epic Fortitude') {
        result.saves.fortitude = 4;
    } else if (name === 'Epic Reflexes') {
        result.saves.reflex = 4;
    } else if (name === 'Epic Will') {
        result.saves.will = 4;
    }

    // Superior Initiative
    if (name === 'Superior Initiative') {
        result.initiative = 8;
    }

    // Legendary Wrestler - grapple bonus
    if (name === 'Legendary Wrestler') {
        result.skills['Grapple'] = (result.skills['Grapple'] || 0) + 10;
    }

    // Epic Reputation - multiple skills
    if (name === 'Epic Reputation') {
        const reputationSkills = ['Bluff', 'Diplomacy', 'Gather Information', 'Intimidate', 'Perform'];
        reputationSkills.forEach(skill => {
            result.skills[skill] = (result.skills[skill] || 0) + 4;
        });
    }

    return result;
}

/**
 * Parse skill name from benefit text and normalize it
 */
function parseSkillName(skillText) {
    if (!skillText) return null;

    // Clean up the text
    let cleaned = skillText.trim();

    // Remove common prefixes/suffixes
    cleaned = cleaned.replace(/\s+checks?$/i, '');
    cleaned = cleaned.replace(/^all\s+/i, '');

    // Skill name mapping for common variations
    const skillMap = {
        'jump': 'Jump',
        'tumble': 'Tumble',
        'balance': 'Balance',
        'escape artist': 'Escape Artist',
        'listen': 'Listen',
        'spot': 'Spot',
        'handle animal': 'Handle Animal',
        'ride': 'Ride',
        'climb': 'Climb',
        'swim': 'Swim',
        'disguise': 'Disguise',
        'forgery': 'Forgery',
        'sleight of hand': 'Sleight of Hand',
        'use rope': 'Use Rope',
        'appraise': 'Appraise',
        'decipher script': 'Decipher Script',
        'gather information': 'Gather Information',
        'search': 'Search',
        'spellcraft': 'Spellcraft',
        'use magic device': 'Use Magic Device',
        'diplomacy': 'Diplomacy',
        'sense motive': 'Sense Motive',
        'disable device': 'Disable Device',
        'open lock': 'Open Lock',
        'bluff': 'Bluff',
        'intimidate': 'Intimidate',
        'heal': 'Heal',
        'survival': 'Survival',
        'hide': 'Hide',
        'move silently': 'Move Silently',
        'concentration': 'Concentration',
        'knowledge': 'Knowledge',
        'perform': 'Perform',
        'profession': 'Profession',
        'craft': 'Craft'
    };

    const lowerCleaned = cleaned.toLowerCase();
    return skillMap[lowerCleaned] || null;
}

/**
 * Check if a feat has automatable bonuses
 */
function featHasAutomatableBonuses(featData) {
    const parsed = parseFeatBenefits(featData);

    // Check if any numeric bonuses were found
    const hasSaveBonuses = parsed.saves.fortitude !== 0 || parsed.saves.reflex !== 0 || parsed.saves.will !== 0;
    const hasHPBonus = parsed.hp !== 0;
    const hasInitBonus = parsed.initiative !== 0;
    const hasSkillBonuses = Object.keys(parsed.skills).length > 0;
    const hasAttackBonuses = Object.keys(parsed.attack).length > 0;
    const hasDamageBonuses = Object.keys(parsed.damage).length > 0;
    const hasACBonus = parsed.ac !== 0;

    return hasSaveBonuses || hasHPBonus || hasInitBonus || hasSkillBonuses ||
           hasAttackBonuses || hasDamageBonuses || hasACBonus || parsed.special.length > 0;
}

/**
 * Get a human-readable description of what a feat does mechanically
 */
function getFeatMechanicalSummary(featData, choice = null) {
    const parsed = parseFeatBenefits(featData, choice);
    const effects = [];

    // Saves
    if (parsed.saves.fortitude !== 0) {
        effects.push(`${parsed.saves.fortitude > 0 ? '+' : ''}${parsed.saves.fortitude} Fortitude save`);
    }
    if (parsed.saves.reflex !== 0) {
        effects.push(`${parsed.saves.reflex > 0 ? '+' : ''}${parsed.saves.reflex} Reflex save`);
    }
    if (parsed.saves.will !== 0) {
        effects.push(`${parsed.saves.will > 0 ? '+' : ''}${parsed.saves.will} Will save`);
    }

    // HP
    if (parsed.hp !== 0) {
        effects.push(`${parsed.hp > 0 ? '+' : ''}${parsed.hp} HP`);
    }

    // Initiative
    if (parsed.initiative !== 0) {
        effects.push(`${parsed.initiative > 0 ? '+' : ''}${parsed.initiative} Initiative`);
    }

    // AC
    if (parsed.ac !== 0) {
        effects.push(`${parsed.ac > 0 ? '+' : ''}${parsed.ac} AC`);
    }

    // Skills
    Object.entries(parsed.skills).forEach(([skill, bonus]) => {
        effects.push(`${bonus > 0 ? '+' : ''}${bonus} ${skill}`);
    });

    // Attack/Damage (weapon-specific)
    Object.entries(parsed.attack).forEach(([weapon, bonus]) => {
        effects.push(`${bonus > 0 ? '+' : ''}${bonus} attack with ${weapon}`);
    });
    Object.entries(parsed.damage).forEach(([weapon, bonus]) => {
        effects.push(`${bonus > 0 ? '+' : ''}${bonus} damage with ${weapon}`);
    });

    // Special effects
    parsed.special.forEach(special => {
        effects.push(special.description);
    });

    return effects.length > 0 ? effects.join(', ') : 'No automatic bonuses';
}

/**
 * Categorize a feat into one of several categories
 * @param {string} name - Feat name
 * @param {string} type - Feat type from database
 * @param {string} benefit - Feat benefit text
 * @returns {string} Category: 'automatic', 'manual', 'informational', 'metamagic', 'special_ui'
 */
function categorizeFeat(name, type, benefit) {
    const lowerName = name.toLowerCase();
    const lowerType = type.toLowerCase();
    const lowerBenefit = benefit.toLowerCase();

    // Item creation feats - informational
    if (lowerName.includes('craft') || lowerName.includes('forge') ||
        lowerName.includes('scribe') || lowerName.includes('brew') ||
        lowerName.includes('imprint')) {
        return 'informational';
    }

    // Proficiency feats - informational
    if (lowerName.includes('proficiency')) {
        return 'informational';
    }

    // Metamagic feats - special (spell system needed)
    if (lowerType === 'metamagic' ||
        lowerName.includes('empower') || lowerName.includes('maximize') ||
        lowerName.includes('quicken') || lowerName.includes('widen') ||
        lowerName.includes('extend') || lowerName.includes('enlarge') ||
        lowerName.includes('heighten') || lowerName.includes('silent') ||
        lowerName.includes('still') || lowerName.includes('persistent')) {
        return 'metamagic';
    }

    // Special UI needed
    if (lowerName === 'skill knowledge' || lowerName === 'open minded') {
        return 'special_ui';
    }

    // Manual tracking feats (activated abilities)
    if (lowerName === 'power attack' || lowerName === 'combat expertise') {
        return 'manual';
    }

    // Check for numeric bonuses (automatic)
    const hasNumericBonus = /\+\d+/.test(benefit);
    if (hasNumericBonus) {
        // Check if it's a simple bonus feat
        if (lowerBenefit.includes('bonus on') || lowerBenefit.includes('bonus to') ||
            lowerBenefit.includes('hit point') || lowerBenefit.includes('initiative') ||
            lowerBenefit.includes('save') || lowerBenefit.includes('armor class')) {
            return 'automatic';
        }
    }

    // Weapon/combat feats with choices
    if (lowerName.includes('weapon focus') || lowerName.includes('weapon specialization')) {
        return 'automatic';
    }

    // Complex/situational feats - manual tracking
    if (lowerBenefit.includes('attack of opportunity') ||
        lowerBenefit.includes('extra attack') ||
        lowerBenefit.includes('move action') ||
        lowerBenefit.includes('full-round action') ||
        lowerBenefit.includes('as a free action') ||
        lowerBenefit.includes('threatened') ||
        lowerBenefit.includes('concealment') ||
        lowerBenefit.includes('cover')) {
        return 'manual';
    }

    // Leadership and companion feats - informational
    if (lowerName.includes('leadership') || lowerName.includes('familiar') ||
        lowerName.includes('companion') || lowerName.includes('cohort')) {
        return 'informational';
    }

    // Default to manual tracking for unknown complex feats
    return 'manual';
}

/**
 * Get a human-readable description for a feat category
 * @param {string} category - Feat category
 * @returns {string} Description
 */
function getFeatCategoryDescription(category) {
    const descriptions = {
        'automatic': 'This feat provides automatic bonuses that are applied to your stats.',
        'manual': 'This feat requires manual tracking during gameplay. It may be situational or provide tactical options.',
        'informational': 'This feat enables abilities or crafting. No automatic bonuses to track.',
        'metamagic': 'This feat modifies spells. Requires spell system integration.',
        'special_ui': 'This feat requires special UI implementation to fully automate.'
    };

    return descriptions[category] || 'Unknown feat type.';
}

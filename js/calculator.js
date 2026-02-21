// calculator.js - D&D 3.5 Calculation Engine

class Calculator {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
    }

    // Calculate ability modifier
    calculateAbilityModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    // Calculate final ability scores
    calculateFinalAbilities(characterData) {
        const abilities = {};
        const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

        abilityNames.forEach(ability => {
            // Base + Racial + Level-ups + Magic + Misc + Temp
            let total = characterData.abilities.base[ability] || 10;
            total += characterData.abilities.racial[ability] || 0;
            total += characterData.abilities.magic[ability] || 0;
            total += characterData.abilities.misc[ability] || 0;
            total += characterData.abilities.temp[ability] || 0;

            // Add level-up bonuses
            Object.entries(characterData.abilities.levelUps || {}).forEach(([level, bonusAbility]) => {
                if (bonusAbility === ability && parseInt(level) <= characterData.level) {
                    total += 1;
                }
            });

            abilities[ability] = {
                score: total,
                modifier: this.calculateAbilityModifier(total)
            };
        });

        return abilities;
    }

    // Calculate Base Attack Bonus
    // D&D 3.5 rule: floor each class's BAB independently, then sum
    calculateBAB(characterData) {
        // Group levels by class
        const classLevels = {};
        characterData.classes.forEach(classLevel => {
            if (!classLevels[classLevel.className]) {
                classLevels[classLevel.className] = 0;
            }
            classLevels[classLevel.className]++;
        });

        let bab = 0;
        Object.entries(classLevels).forEach(([className, levels]) => {
            const classData = this.dataLoader.getClass(className);
            if (classData) {
                const progression = classData.baseAttack;
                if (progression === 'Full') {
                    bab += levels; // +1 per level
                } else if (progression === 'Good') {
                    bab += Math.floor(levels * 0.75); // 3/4 per level, floored
                } else if (progression === 'Poor') {
                    bab += Math.floor(levels * 0.5); // 1/2 per level, floored
                }
            }
        });

        return bab;
    }

    // Calculate save base values
    // D&D 3.5 rule: Good = 2 + floor(levels/2), Poor = floor(levels/3)
    // Each class contributes independently for multiclass characters
    calculateSaveBase(characterData, saveType) {
        // Group levels by class
        const classLevels = {};
        characterData.classes.forEach(classLevel => {
            if (!classLevels[classLevel.className]) {
                classLevels[classLevel.className] = 0;
            }
            classLevels[classLevel.className]++;
        });

        let base = 0;
        Object.entries(classLevels).forEach(([className, levels]) => {
            const classData = this.dataLoader.getClass(className);
            if (classData) {
                const saveMap = {
                    'fortitude': classData.fortSave,
                    'reflex': classData.reflexSave,
                    'will': classData.willSave
                };

                const progression = saveMap[saveType];
                if (progression === 'Good') {
                    base += 2 + Math.floor(levels / 2);
                } else if (progression === 'Poor') {
                    base += Math.floor(levels / 3);
                }
            }
        });

        return base;
    }

    // Calculate total character level
    calculateTotalLevel(characterData) {
        return characterData.classes.length;
    }

    // Return cached feat bonuses if available, otherwise compute
    calculateFeatBonuses(characterData) {
        if (this._cachedFeatBonuses) {
            return this._cachedFeatBonuses;
        }
        return this._computeFeatBonuses(characterData);
    }

    // Compute all feat bonuses using feat parser
    _computeFeatBonuses(characterData) {
        const bonuses = {
            fortitude: 0,
            reflex: 0,
            will: 0,
            hp: 0,
            initiative: 0,
            ac: 0,
            skills: {}, // skill name -> bonus
            attack: {}, // weapon name -> bonus
            damage: {}, // weapon name -> bonus
            special: [] // Special effects (Skill Knowledge, Open Minded, etc.)
        };

        if (!characterData.feats || characterData.feats.length === 0) {
            return bonuses;
        }

        characterData.feats.forEach(feat => {
            const featName = feat.name;
            const choice = feat.choice || feat.details;

            // Get feat data from database
            const featData = this.dataLoader.gameData.feats.get(featName);
            if (!featData) {
                console.warn(`Feat not found in database: ${featName}`);
                return;
            }

            // Parse feat benefits automatically
            const parsed = parseFeatBenefits(featData, choice);

            // Merge parsed bonuses into totals
            bonuses.fortitude += parsed.saves.fortitude;
            bonuses.reflex += parsed.saves.reflex;
            bonuses.will += parsed.saves.will;
            bonuses.ac += parsed.ac;
            bonuses.initiative += parsed.initiative;

            // HP bonuses - handle special case for Toughness scaling
            if (featName === 'Toughness') {
                const level = this.calculateTotalLevel(characterData);
                bonuses.hp += level <= 3 ? 3 : level;
            } else {
                bonuses.hp += parsed.hp;
            }

            // Merge skill bonuses
            Object.entries(parsed.skills).forEach(([skill, bonus]) => {
                bonuses.skills[skill] = (bonuses.skills[skill] || 0) + bonus;
            });

            // Merge attack bonuses
            Object.entries(parsed.attack).forEach(([weapon, bonus]) => {
                bonuses.attack[weapon] = (bonuses.attack[weapon] || 0) + bonus;
            });

            // Merge damage bonuses
            Object.entries(parsed.damage).forEach(([weapon, bonus]) => {
                bonuses.damage[weapon] = (bonuses.damage[weapon] || 0) + bonus;
            });

            // Collect special effects
            if (parsed.special.length > 0) {
                bonuses.special.push(...parsed.special);
            }
        });

        return bonuses;
    }

    // Calculate all saves
    calculateSaves(characterData, abilities, flawPenalties = null) {
        const flawFortPenalty = flawPenalties ? flawPenalties.fortitude : 0;
        const flawRefPenalty = flawPenalties ? flawPenalties.reflex : 0;
        const flawWillPenalty = flawPenalties ? flawPenalties.will : 0;

        // NEW: Calculate feat bonuses for saves
        const featBonuses = this.calculateFeatBonuses(characterData);

        return {
            fortitude: {
                base: this.calculateSaveBase(characterData, 'fortitude'),
                ability: abilities.con.modifier,
                magic: characterData.saves.fortitude.magic || 0,
                feats: featBonuses.fortitude,
                temp: characterData.saves.fortitude.temp || 0,
                flaws: flawFortPenalty,
                get total() {
                    return this.base + this.ability + this.magic + this.feats + this.temp + this.flaws;
                }
            },
            reflex: {
                base: this.calculateSaveBase(characterData, 'reflex'),
                ability: abilities.dex.modifier,
                magic: characterData.saves.reflex.magic || 0,
                feats: featBonuses.reflex,
                temp: characterData.saves.reflex.temp || 0,
                flaws: flawRefPenalty,
                get total() {
                    return this.base + this.ability + this.magic + this.feats + this.temp + this.flaws;
                }
            },
            will: {
                base: this.calculateSaveBase(characterData, 'will'),
                ability: abilities.wis.modifier,
                magic: characterData.saves.will.magic || 0,
                feats: featBonuses.will,
                temp: characterData.saves.will.temp || 0,
                flaws: flawWillPenalty,
                get total() {
                    return this.base + this.ability + this.magic + this.feats + this.temp + this.flaws;
                }
            }
        };
    }

    // Calculate Hit Points
    calculateHP(characterData, abilities) {
        let baseHP = 0;

        characterData.classes.forEach((classLevel, index) => {
            const hp = classLevel.hp || 0;
            const conMod = abilities.con.modifier;

            // First level gets max HP + CON mod
            if (index === 0) {
                const classData = this.dataLoader.getClass(classLevel.className);
                const maxHP = classData ? classData.hitDie : 8;
                baseHP += Math.max(hp || maxHP, 1) + conMod;
            } else {
                baseHP += Math.max(hp + conMod, 1);
            }
        });

        // NEW: Add feat bonuses (Toughness)
        const featBonuses = this.calculateFeatBonuses(characterData);
        baseHP += featBonuses.hp;

        return {
            base: baseHP,
            constitution: 0, // Additional CON bonuses
            total: baseHP,
            temporary: characterData.combat.hp.temporary || 0,
            wounds: characterData.combat.hp.wounds || 0,
            subdual: characterData.combat.hp.subdual || 0,
            get current() {
                return this.total + this.temporary - this.wounds;
            }
        };
    }

    // Get size modifier
    getSizeModifier(size) {
        const modifiers = this.dataLoader.gameData.sizeModifiers.get(size);
        return modifiers || { ac: 0, grapple: 0, hide: 0 };
    }

    // Calculate Armor Class
    calculateAC(characterData, abilities, flawPenalties = null) {
        const sizeModifier = this.getSizeModifier(characterData.size);
        const dexMod = abilities.dex.modifier;

        const combat = characterData.combat;
        const ac = combat.ac;

        // Apply flaw penalties if provided
        const flawACPenalty = flawPenalties ? flawPenalties.ac : 0;
        const flawTouchACPenalty = flawPenalties ? flawPenalties.touch_ac : 0;
        const flawFlatFootedACPenalty = flawPenalties ? flawPenalties.flatfooted_ac : 0;

        // NEW: Get feat bonuses (e.g., Sharp Shooting)
        const featBonuses = this.calculateFeatBonuses(characterData);
        const featACBonus = featBonuses.ac || 0;

        // NEW: Get Combat Expertise bonus
        const activatedFeats = characterData.combat.activatedFeats || { powerAttack: 0, combatExpertise: 0 };
        const combatExpertiseBonus = activatedFeats.combatExpertise || 0;

        const fullAC = 10 +
            (ac.armor || 0) +
            (ac.shield || 0) +
            dexMod +
            (ac.natural || 0) +
            (ac.deflect || 0) +
            sizeModifier.ac +
            (ac.misc || 0) +
            (ac.temp || 0) +
            featACBonus +
            combatExpertiseBonus +
            flawACPenalty;

        const flatFootedAC = 10 +
            (ac.armor || 0) +
            (ac.shield || 0) +
            (ac.natural || 0) +
            (ac.deflect || 0) +
            sizeModifier.ac +
            (ac.misc || 0) +
            (ac.temp || 0) +
            featACBonus +
            combatExpertiseBonus +
            flawACPenalty +
            flawFlatFootedACPenalty;

        const touchAC = 10 +
            dexMod +
            (ac.deflect || 0) +
            sizeModifier.ac +
            (ac.misc || 0) +
            (ac.temp || 0) +
            featACBonus +
            combatExpertiseBonus +
            flawACPenalty +
            flawTouchACPenalty;

        return {
            full: fullAC,
            flatFooted: flatFootedAC,
            touch: touchAC,
            components: {
                armor: ac.armor || 0,
                shield: ac.shield || 0,
                dex: dexMod,
                natural: ac.natural || 0,
                deflect: ac.deflect || 0,
                size: sizeModifier.ac,
                misc: ac.misc || 0,
                temp: ac.temp || 0,
                feats: featACBonus,
                combatExpertise: combatExpertiseBonus,
                flaws: flawACPenalty
            }
        };
    }

    // Calculate Initiative
    calculateInitiative(characterData, abilities, flawPenalties = null) {
        const dexMod = abilities.dex.modifier;
        const init = characterData.combat.initiative;

        const flawInitPenalty = flawPenalties ? flawPenalties.initiative : 0;

        // NEW: Add feat bonuses (Improved Initiative)
        const featBonuses = this.calculateFeatBonuses(characterData);

        return dexMod + (init.magic || 0) + (init.misc || 0) + featBonuses.initiative + (init.temp || 0) + flawInitPenalty;
    }

    // Calculate Attack Bonuses
    calculateAttackBonuses(characterData, abilities, bab, flawPenalties = null) {
        const sizeModifier = this.getSizeModifier(characterData.size);
        const strMod = abilities.str.modifier;
        const dexMod = abilities.dex.modifier;

        const grapple = characterData.combat.grapple;
        const melee = characterData.combat.melee;
        const ranged = characterData.combat.ranged;

        // Apply flaw penalties if provided
        const flawMeleePenalty = flawPenalties ? flawPenalties.melee_attack : 0;
        const flawRangedPenalty = flawPenalties ? flawPenalties.ranged_attack : 0;

        // NEW: Get activated feat penalties (Power Attack, Combat Expertise)
        const activatedFeats = characterData.combat.activatedFeats || { powerAttack: 0, combatExpertise: 0 };
        const powerAttackPenalty = -(activatedFeats.powerAttack || 0);
        const combatExpertisePenalty = -(activatedFeats.combatExpertise || 0);
        const totalActivatedPenalty = powerAttackPenalty + combatExpertisePenalty;

        return {
            grapple: {
                total: bab + strMod + sizeModifier.grapple + (grapple.magic || 0) + (grapple.misc || 0) + (grapple.temp || 0) + powerAttackPenalty,
                components: {
                    base: bab,
                    ability: strMod,
                    size: sizeModifier.grapple,
                    magic: grapple.magic || 0,
                    misc: grapple.misc || 0,
                    temp: grapple.temp || 0,
                    powerAttack: powerAttackPenalty
                }
            },
            melee: {
                total: bab + strMod + sizeModifier.ac + (melee.magic || 0) + (melee.misc || 0) + (melee.temp || 0) + flawMeleePenalty + totalActivatedPenalty,
                components: {
                    base: bab,
                    ability: strMod,
                    size: sizeModifier.ac,
                    magic: melee.magic || 0,
                    misc: melee.misc || 0,
                    temp: melee.temp || 0,
                    flaws: flawMeleePenalty,
                    powerAttack: powerAttackPenalty,
                    combatExpertise: combatExpertisePenalty
                }
            },
            ranged: {
                total: bab + dexMod + sizeModifier.ac + (ranged.magic || 0) + (ranged.misc || 0) + (ranged.temp || 0) + flawRangedPenalty,
                components: {
                    base: bab,
                    ability: dexMod,
                    size: sizeModifier.ac,
                    magic: ranged.magic || 0,
                    misc: ranged.misc || 0,
                    temp: ranged.temp || 0,
                    flaws: flawRangedPenalty
                }
            }
        };
    }

    // Calculate skill modifier
    calculateSkillModifier(characterData, skillName, abilities, flawPenalties = null) {
        const skill = characterData.skills[skillName];
        if (!skill) return 0;

        const abilityScore = abilities[skill.ability.toLowerCase()];
        const abilityMod = abilityScore ? abilityScore.modifier : 0;

        // NEW: Get all feat bonuses for skills (includes Skill Focus and skill pair feats)
        const featBonuses = this.calculateFeatBonuses(characterData);
        const featBonus = featBonuses.skills[skillName] || 0;

        // Apply flaw penalties for this skill
        let flawPenalty = 0;
        if (flawPenalties && flawPenalties.skill_penalties[skillName]) {
            flawPenalty = flawPenalties.skill_penalties[skillName];
        }

        return skill.totalRanks + abilityMod + (skill.bonus || 0) + featBonus + flawPenalty;
    }

    // Check if skill is class skill for any of character's classes
    isClassSkillForCharacter(characterData, skillName) {
        // Check character-specific class skills (from Skill Knowledge feat, etc.)
        if (characterData.characterClassSkills &&
            characterData.characterClassSkills.includes(skillName)) {
            return true;
        }

        // Check class-based class skills
        for (const classLevel of characterData.classes) {
            if (this.dataLoader.isClassSkill(skillName, classLevel.className)) {
                return true;
            }
        }
        return false;
    }

    // Calculate max skill ranks for a level
    calculateMaxSkillRanks(characterData, skillName, level) {
        // Determine if skill is class skill for any of the character's classes up to this level
        const isClassSkill = this.isClassSkillForCharacter(characterData, skillName);

        if (isClassSkill) {
            return level + 3; // Class skill: level + 3
        } else {
            return Math.floor((level + 3) / 2); // Cross-class: (level + 3) / 2
        }
    }

    // Calculate skill points for a level
    calculateSkillPoints(classData, intModifier) {
        const basePoints = classData.skillPoints || 2;
        const bonus = Math.max(intModifier, 0); // INT bonus (minimum 0)
        return basePoints + bonus;
    }

    // Calculate available skill points for a level
    calculateAvailableSkillPoints(characterData, level) {
        const emptyResult = { total: 0, spent: 0, remaining: 0 };

        if (level > characterData.classes.length || level < 1) return emptyResult;

        const classLevel = characterData.classes[level - 1];
        if (!classLevel) return emptyResult;

        const classData = this.dataLoader.getClass(classLevel.className);
        if (!classData) return emptyResult;

        // Get INT modifier at this level
        const abilities = this.calculateFinalAbilities(characterData);
        const intMod = abilities.int.modifier;

        let totalPoints = this.calculateSkillPoints(classData, intMod);

        // NEW: Add Open Minded bonus (+5 skill points one-time at the level it was taken)
        const openMindedFeat = characterData.feats.find(f => f.name === 'Open Minded');
        if (openMindedFeat && openMindedFeat.level === level) {
            totalPoints += 5;
        }

        // Calculate spent points
        let spentPoints = 0;
        Object.entries(characterData.skills).forEach(([skillName, skill]) => {
            const ranks = skill.ranks[level - 1] || 0;
            const isClassSkill = this.dataLoader.isClassSkill(skillName, classLevel.className);

            if (isClassSkill) {
                spentPoints += ranks; // 1 point per rank
            } else {
                spentPoints += ranks * 2; // 2 points per rank (cross-class)
            }
        });

        return {
            total: totalPoints,
            spent: spentPoints,
            remaining: totalPoints - spentPoints
        };
    }

    // Calculate carrying capacity
    calculateCarryingCapacity(abilities) {
        const strScore = abilities.str.score;
        const capacity = this.dataLoader.gameData.carryingCapacity.get(strScore);

        if (capacity) {
            return capacity;
        }

        // Fallback calculation for scores not in table
        const baseCapacity = Math.pow(2, Math.floor((strScore - 10) / 2)) * 10;

        return {
            light: Math.floor(baseCapacity),
            medium: Math.floor(baseCapacity * 2),
            heavy: Math.floor(baseCapacity * 3),
            lift: Math.floor(baseCapacity * 6),
            drag: Math.floor(baseCapacity * 15)
        };
    }

    // Calculate experience needed for next level
    calculateNextLevelXP(level) {
        // Standard D&D 3.5 XP table
        const xpTable = [
            0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000,
            55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000, 210000
        ];

        if (level < xpTable.length - 1) {
            return xpTable[level];
        }

        // Formula for levels beyond 20
        return 190000 + ((level - 19) * 20000);
    }

    // Calculate spell DC
    calculateSpellDC(spellLevel, casterAbility, casterLevel) {
        return 10 + spellLevel + casterAbility;
    }

    // Calculate spell ranges
    calculateSpellRanges(casterLevel) {
        return {
            close: 25 + Math.floor(casterLevel / 2) * 5,
            medium: 100 + (casterLevel * 10),
            long: 400 + (casterLevel * 40)
        };
    }

    // D&D 3.5 Spell Progression Tables
    // Format: [level 1-20] for spell levels 0-9
    getSpellProgressionTable() {
        return {
            // Full casters (Wizard, Cleric, Druid)
            'Wizard': [
                [3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
                [4, 2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
                [4, 2, 1, 0, 0, 0, 0, 0, 0, 0], // Level 3
                [4, 3, 2, 0, 0, 0, 0, 0, 0, 0], // Level 4
                [4, 3, 2, 1, 0, 0, 0, 0, 0, 0], // Level 5
                [4, 3, 3, 2, 0, 0, 0, 0, 0, 0], // Level 6
                [4, 4, 3, 2, 1, 0, 0, 0, 0, 0], // Level 7
                [4, 4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
                [4, 4, 4, 3, 2, 1, 0, 0, 0, 0], // Level 9
                [4, 4, 4, 3, 3, 2, 0, 0, 0, 0], // Level 10
                [4, 4, 4, 4, 3, 2, 1, 0, 0, 0], // Level 11
                [4, 4, 4, 4, 3, 3, 2, 0, 0, 0], // Level 12
                [4, 4, 4, 4, 4, 3, 2, 1, 0, 0], // Level 13
                [4, 4, 4, 4, 4, 3, 3, 2, 0, 0], // Level 14
                [4, 4, 4, 4, 4, 4, 3, 2, 1, 0], // Level 15
                [4, 4, 4, 4, 4, 4, 3, 3, 2, 0], // Level 16
                [4, 4, 4, 4, 4, 4, 4, 3, 2, 1], // Level 17
                [4, 4, 4, 4, 4, 4, 4, 3, 3, 2], // Level 18
                [4, 4, 4, 4, 4, 4, 4, 4, 3, 3], // Level 19
                [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]  // Level 20
            ],
            'Cleric': [
                [3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
                [4, 2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
                [4, 2, 1, 0, 0, 0, 0, 0, 0, 0], // Level 3
                [5, 3, 2, 0, 0, 0, 0, 0, 0, 0], // Level 4
                [5, 3, 2, 1, 0, 0, 0, 0, 0, 0], // Level 5
                [5, 3, 3, 2, 0, 0, 0, 0, 0, 0], // Level 6
                [6, 4, 3, 2, 1, 0, 0, 0, 0, 0], // Level 7
                [6, 4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
                [6, 4, 4, 3, 2, 1, 0, 0, 0, 0], // Level 9
                [6, 4, 4, 3, 3, 2, 0, 0, 0, 0], // Level 10
                [6, 5, 4, 4, 3, 2, 1, 0, 0, 0], // Level 11
                [6, 5, 4, 4, 3, 3, 2, 0, 0, 0], // Level 12
                [6, 5, 5, 4, 4, 3, 2, 1, 0, 0], // Level 13
                [6, 5, 5, 4, 4, 3, 3, 2, 0, 0], // Level 14
                [6, 5, 5, 5, 4, 4, 3, 2, 1, 0], // Level 15
                [6, 5, 5, 5, 4, 4, 3, 3, 2, 0], // Level 16
                [6, 5, 5, 5, 5, 4, 4, 3, 2, 1], // Level 17
                [6, 5, 5, 5, 5, 4, 4, 3, 3, 2], // Level 18
                [6, 5, 5, 5, 5, 5, 4, 4, 3, 3], // Level 19
                [6, 5, 5, 5, 5, 5, 4, 4, 4, 4]  // Level 20
            ],
            'Druid': [
                [3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
                [4, 2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
                [4, 2, 1, 0, 0, 0, 0, 0, 0, 0], // Level 3
                [5, 3, 2, 0, 0, 0, 0, 0, 0, 0], // Level 4
                [5, 3, 2, 1, 0, 0, 0, 0, 0, 0], // Level 5
                [5, 3, 3, 2, 0, 0, 0, 0, 0, 0], // Level 6
                [6, 4, 3, 2, 1, 0, 0, 0, 0, 0], // Level 7
                [6, 4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
                [6, 4, 4, 3, 2, 1, 0, 0, 0, 0], // Level 9
                [6, 4, 4, 3, 3, 2, 0, 0, 0, 0], // Level 10
                [6, 5, 4, 4, 3, 2, 1, 0, 0, 0], // Level 11
                [6, 5, 4, 4, 3, 3, 2, 0, 0, 0], // Level 12
                [6, 5, 5, 4, 4, 3, 2, 1, 0, 0], // Level 13
                [6, 5, 5, 4, 4, 3, 3, 2, 0, 0], // Level 14
                [6, 5, 5, 5, 4, 4, 3, 2, 1, 0], // Level 15
                [6, 5, 5, 5, 4, 4, 3, 3, 2, 0], // Level 16
                [6, 5, 5, 5, 5, 4, 4, 3, 2, 1], // Level 17
                [6, 5, 5, 5, 5, 4, 4, 3, 3, 2], // Level 18
                [6, 5, 5, 5, 5, 5, 4, 4, 3, 3], // Level 19
                [6, 5, 5, 5, 5, 5, 4, 4, 4, 4]  // Level 20
            ],
            // Spontaneous casters (Sorcerer, Bard)
            'Sorcerer': [
                [5, 3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
                [6, 4, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
                [6, 5, 0, 0, 0, 0, 0, 0, 0, 0], // Level 3
                [6, 6, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
                [6, 6, 4, 0, 0, 0, 0, 0, 0, 0], // Level 5
                [6, 6, 5, 3, 0, 0, 0, 0, 0, 0], // Level 6
                [6, 6, 6, 4, 0, 0, 0, 0, 0, 0], // Level 7
                [6, 6, 6, 5, 3, 0, 0, 0, 0, 0], // Level 8
                [6, 6, 6, 6, 4, 0, 0, 0, 0, 0], // Level 9
                [6, 6, 6, 6, 5, 3, 0, 0, 0, 0], // Level 10
                [6, 6, 6, 6, 6, 4, 0, 0, 0, 0], // Level 11
                [6, 6, 6, 6, 6, 5, 3, 0, 0, 0], // Level 12
                [6, 6, 6, 6, 6, 6, 4, 0, 0, 0], // Level 13
                [6, 6, 6, 6, 6, 6, 5, 3, 0, 0], // Level 14
                [6, 6, 6, 6, 6, 6, 6, 4, 0, 0], // Level 15
                [6, 6, 6, 6, 6, 6, 6, 5, 3, 0], // Level 16
                [6, 6, 6, 6, 6, 6, 6, 6, 4, 0], // Level 17
                [6, 6, 6, 6, 6, 6, 6, 6, 5, 3], // Level 18
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 4], // Level 19
                [6, 6, 6, 6, 6, 6, 6, 6, 6, 6]  // Level 20
            ],
            'Bard': [
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
                [3, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
                [3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Level 3
                [3, 2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 4
                [3, 3, 1, 0, 0, 0, 0, 0, 0, 0], // Level 5
                [3, 3, 2, 0, 0, 0, 0, 0, 0, 0], // Level 6
                [3, 3, 2, 0, 0, 0, 0, 0, 0, 0], // Level 7
                [3, 3, 3, 1, 0, 0, 0, 0, 0, 0], // Level 8
                [3, 3, 3, 2, 0, 0, 0, 0, 0, 0], // Level 9
                [3, 3, 3, 2, 0, 0, 0, 0, 0, 0], // Level 10
                [3, 3, 3, 3, 1, 0, 0, 0, 0, 0], // Level 11
                [3, 3, 3, 3, 2, 0, 0, 0, 0, 0], // Level 12
                [3, 3, 3, 3, 2, 0, 0, 0, 0, 0], // Level 13
                [4, 3, 3, 3, 3, 1, 0, 0, 0, 0], // Level 14
                [4, 4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 15
                [4, 4, 4, 3, 3, 2, 0, 0, 0, 0], // Level 16
                [4, 4, 4, 4, 3, 3, 0, 0, 0, 0], // Level 17
                [4, 4, 4, 4, 4, 3, 0, 0, 0, 0], // Level 18
                [4, 4, 4, 4, 4, 4, 0, 0, 0, 0], // Level 19
                [4, 4, 4, 4, 4, 4, 0, 0, 0, 0]  // Level 20
            ],
            // Half-casters (Ranger, Paladin) — no cantrips, max 4th level spells, begin casting at level 4
            // -1 = no access to this spell level; 0 = has access but 0 base slots (bonus spells only)
            'Ranger': [
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 1
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 2
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 3
                [-1,  0, -1, -1, -1, -1, -1, -1, -1, -1], // Level 4
                [-1,  0, -1, -1, -1, -1, -1, -1, -1, -1], // Level 5
                [-1,  1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 6
                [-1,  1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 7
                [-1,  1,  0, -1, -1, -1, -1, -1, -1, -1], // Level 8
                [-1,  1,  0, -1, -1, -1, -1, -1, -1, -1], // Level 9
                [-1,  1,  1, -1, -1, -1, -1, -1, -1, -1], // Level 10
                [-1,  1,  1,  0, -1, -1, -1, -1, -1, -1], // Level 11
                [-1,  1,  1,  1, -1, -1, -1, -1, -1, -1], // Level 12
                [-1,  1,  1,  1, -1, -1, -1, -1, -1, -1], // Level 13
                [-1,  2,  1,  1,  0, -1, -1, -1, -1, -1], // Level 14
                [-1,  2,  1,  1,  1, -1, -1, -1, -1, -1], // Level 15
                [-1,  2,  2,  1,  1, -1, -1, -1, -1, -1], // Level 16
                [-1,  3,  2,  2,  1, -1, -1, -1, -1, -1], // Level 17
                [-1,  3,  2,  2,  1, -1, -1, -1, -1, -1], // Level 18
                [-1,  3,  3,  3,  2, -1, -1, -1, -1, -1], // Level 19
                [-1,  3,  3,  3,  3, -1, -1, -1, -1, -1]  // Level 20
            ],
            'Paladin': [
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 1
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 2
                [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 3
                [-1,  0, -1, -1, -1, -1, -1, -1, -1, -1], // Level 4
                [-1,  0, -1, -1, -1, -1, -1, -1, -1, -1], // Level 5
                [-1,  1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 6
                [-1,  1, -1, -1, -1, -1, -1, -1, -1, -1], // Level 7
                [-1,  1,  0, -1, -1, -1, -1, -1, -1, -1], // Level 8
                [-1,  1,  0, -1, -1, -1, -1, -1, -1, -1], // Level 9
                [-1,  1,  1, -1, -1, -1, -1, -1, -1, -1], // Level 10
                [-1,  1,  1,  0, -1, -1, -1, -1, -1, -1], // Level 11
                [-1,  1,  1,  1, -1, -1, -1, -1, -1, -1], // Level 12
                [-1,  1,  1,  1, -1, -1, -1, -1, -1, -1], // Level 13
                [-1,  2,  1,  1,  0, -1, -1, -1, -1, -1], // Level 14
                [-1,  2,  1,  1,  1, -1, -1, -1, -1, -1], // Level 15
                [-1,  2,  2,  1,  1, -1, -1, -1, -1, -1], // Level 16
                [-1,  3,  2,  2,  1, -1, -1, -1, -1, -1], // Level 17
                [-1,  3,  2,  2,  1, -1, -1, -1, -1, -1], // Level 18
                [-1,  3,  3,  3,  2, -1, -1, -1, -1, -1], // Level 19
                [-1,  3,  3,  3,  3, -1, -1, -1, -1, -1]  // Level 20
            ]
        };
    }

    // Calculate bonus spells from high ability scores (D&D 3.5 PHB Table 1-1)
    calculateBonusSpells(abilityScore, spellLevel) {
        if (spellLevel === 0) return 0; // No bonus cantrips

        // Need ability score of 10 + spell level to cast
        const minScore = 10 + spellLevel;
        if (abilityScore < minScore) return 0;

        // D&D 3.5 formula: bonus = 1 + floor((modifier - spellLevel) / 4)
        // e.g., INT 14 (mod +2), level 1: 1 + floor(1/4) = 1 bonus spell
        // e.g., INT 20 (mod +5), level 1: 1 + floor(4/4) = 2 bonus spells
        const modifier = Math.floor((abilityScore - 10) / 2);
        if (modifier < spellLevel) return 0;

        return 1 + Math.floor((modifier - spellLevel) / 4);
    }

    // Get spells per day for a character's class
    getSpellsPerDay(characterData, className, abilities) {
        const tables = this.getSpellProgressionTable();

        // Auto-detect casting ability based on class
        const classCastingAbility = {
            'Wizard': 'int',
            'Cleric': 'wis',
            'Druid': 'wis',
            'Sorcerer': 'cha',
            'Bard': 'cha',
            'Ranger': 'wis',
            'Paladin': 'cha'
        };
        const castingAbility = classCastingAbility[className] || characterData.spells.castingAbility || 'int';
        const abilityScore = abilities[castingAbility].score;

        // Find class levels for this class
        let classLevel = 0;
        characterData.classes.forEach(cls => {
            if (cls.className === className) {
                classLevel++;
            }
        });

        if (classLevel === 0 || !tables[className]) {
            return Array(10).fill(0);
        }

        // Get base spells per day
        const baseSpells = tables[className][classLevel - 1] || Array(10).fill(0);

        // Add bonus spells from high ability score
        // -1 means no access to this spell level; 0 means access with 0 base slots (bonus spells only)
        const spellsPerDay = baseSpells.map((count, spellLevel) => {
            if (count < 0) return 0; // No access to this spell level
            const bonus = this.calculateBonusSpells(abilityScore, spellLevel);
            return count + bonus;
        });

        return spellsPerDay;
    }

    // NEW: Calculate feat slots available
    calculateFeatSlots(characterData) {
        const level = characterData.level;
        let totalSlots = 0;
        const breakdown = [];

        // Base feats: 1st level + every 3 levels (1, 3, 6, 9, 12, 15, 18...)
        const baseFeatSlots = 1 + Math.floor(level / 3);
        totalSlots += baseFeatSlots;
        breakdown.push({ source: 'Base (1st + every 3 levels)', slots: baseFeatSlots });

        // Bonus feats from classes (count each class only once)
        const countedClasses = new Set();
        characterData.classes.forEach((classLevel) => {
            const className = classLevel.className;
            if (countedClasses.has(className)) return;
            countedClasses.add(className);

            if (className === 'Fighter') {
                // Fighter gets bonus feat at 1st, 2nd, and every 2 levels thereafter
                const fighterLevels = characterData.classes.filter(c => c.className === 'Fighter').length;
                const bonusFeats = 1 + Math.floor(fighterLevels / 2);
                totalSlots += bonusFeats;
                breakdown.push({ source: 'Fighter Bonus Feats', slots: bonusFeats });
            } else if (className === 'Wizard') {
                // Wizard gets bonus feat at 1st, 5th, 10th, 15th, 20th
                const wizardLevels = characterData.classes.filter(c => c.className === 'Wizard').length;
                const bonusFeats = 1 + Math.floor(wizardLevels / 5);
                totalSlots += bonusFeats;
                breakdown.push({ source: 'Wizard Bonus Feats', slots: bonusFeats });
            }
        });

        // Human bonus feat
        if (characterData.race === 'Human') {
            totalSlots += 1;
            breakdown.push({ source: 'Human Bonus Feat', slots: 1 });
        }

        const used = characterData.feats ? characterData.feats.length : 0;
        const available = totalSlots - used;

        return {
            total: totalSlots,
            used: used,
            available: Math.max(available, 0),
            breakdown: breakdown
        };
    }

    // NEW: Check feat prerequisites
    checkFeatPrerequisites(characterData, featData, abilities) {
        const missing = [];

        if (!featData.prerequisite || featData.prerequisite === '') {
            return { qualifies: true, missing: [] };
        }

        const prereqText = featData.prerequisite;
        const prereqLower = prereqText.toLowerCase();

        // Check BAB requirement
        const babMatch = prereqLower.match(/base attack bonus \+?(\d+)/);
        if (babMatch) {
            const requiredBAB = parseInt(babMatch[1]);
            const currentBAB = this.calculateBAB(characterData);
            if (currentBAB < requiredBAB) {
                missing.push(`Base Attack Bonus +${requiredBAB} (current: +${currentBAB})`);
            }
        }

        // Check ability score requirements — handle both abbreviated and full names
        const abilityMap = {
            'str': ['str', 'strength'],
            'dex': ['dex', 'dexterity'],
            'con': ['con', 'constitution'],
            'int': ['int', 'intelligence'],
            'wis': ['wis', 'wisdom'],
            'cha': ['cha', 'charisma']
        };

        Object.entries(abilityMap).forEach(([key, names]) => {
            for (const name of names) {
                const regex = new RegExp(`\\b${name}\\s+(\\d+)`, 'i');
                const match = prereqText.match(regex);
                if (match) {
                    const required = parseInt(match[1]);
                    const current = abilities[key].score;
                    if (current < required) {
                        missing.push(`${key.toUpperCase()} ${required} (current: ${current})`);
                    }
                    break; // Only check once per ability
                }
            }
        });

        // Check feat prerequisites dynamically by extracting feat names from text
        const currentFeats = characterData.feats ? characterData.feats.map(f => f.name.toLowerCase()) : [];
        const allKnownFeats = this.dataLoader.gameData.feats
            ? new Map([...this.dataLoader.gameData.feats].map(([k, v]) => [k.toLowerCase(), k]))
            : new Map();

        // Extract feat names from prerequisite text by matching against the feat database
        // Sort by length descending so longer feat names match first (e.g., "Greater Weapon Focus" before "Weapon Focus")
        const sortedFeatNames = [...allKnownFeats.keys()].sort((a, b) => b.length - a.length);

        // Track which portions of the text we've already matched to avoid sub-matches
        const matchedRanges = [];

        for (const featNameLower of sortedFeatNames) {
            // Skip very short names that might false-match (1-2 char feats)
            if (featNameLower.length < 3) continue;

            const idx = prereqLower.indexOf(featNameLower);
            if (idx === -1) continue;

            // Check this range hasn't already been matched by a longer feat name
            const endIdx = idx + featNameLower.length;
            const alreadyMatched = matchedRanges.some(
                ([start, end]) => idx >= start && idx < end
            );
            if (alreadyMatched) continue;

            // Don't match the feat's own name as a prerequisite
            if (featNameLower === featData.name.toLowerCase()) continue;

            matchedRanges.push([idx, endIdx]);

            // Handle "Weapon Focus (any)" or "Weapon Focus with selected weapon" patterns
            if (prereqLower.includes(featNameLower + ' (any)') ||
                prereqLower.includes(featNameLower + ' with selected')) {
                // Check if character has ANY variant of this feat
                const hasAnyVariant = currentFeats.some(f => f.startsWith(featNameLower));
                if (!hasAnyVariant) {
                    const displayName = allKnownFeats.get(featNameLower) || featNameLower;
                    missing.push(displayName);
                }
            } else {
                if (!currentFeats.includes(featNameLower)) {
                    const displayName = allKnownFeats.get(featNameLower) || featNameLower;
                    missing.push(displayName);
                }
            }
        }

        // Check class level requirements
        // Patterns: "Fighter level 4th", "caster level 5th", "3rd-level bard", "4th-level fighter"

        // Pattern 1: "Fighter level 4th"
        let clMatch;
        const pattern1 = /(\w+)\s+level\s+(\d+)(?:st|nd|rd|th)?/gi;
        while ((clMatch = pattern1.exec(prereqText)) !== null) {
            const className = clMatch[1];
            const requiredLevel = parseInt(clMatch[2]);

            if (className.toLowerCase() === 'caster') {
                // Caster level check
                const casterLevel = characterData.spells.casterLevel || 0;
                if (casterLevel < requiredLevel) {
                    missing.push(`Caster level ${requiredLevel} (current: ${casterLevel})`);
                }
            } else {
                // Specific class level check
                const classLevels = characterData.classes.filter(
                    c => c.className.toLowerCase() === className.toLowerCase()
                ).length;
                if (classLevels < requiredLevel) {
                    const displayClass = className.charAt(0).toUpperCase() + className.slice(1);
                    missing.push(`${displayClass} level ${requiredLevel} (current: ${classLevels})`);
                }
            }
        }

        // Pattern 2: "4th-level fighter"
        const pattern2 = /(\d+)(?:st|nd|rd|th)?[- ]level\s+(\w+)/gi;
        while ((clMatch = pattern2.exec(prereqText)) !== null) {
            const requiredLevel = parseInt(clMatch[1]);
            const className = clMatch[2];

            if (className.toLowerCase() === 'caster') {
                const casterLevel = characterData.spells.casterLevel || 0;
                if (casterLevel < requiredLevel) {
                    missing.push(`Caster level ${requiredLevel} (current: ${casterLevel})`);
                }
            } else {
                const classLevels = characterData.classes.filter(
                    c => c.className.toLowerCase() === className.toLowerCase()
                ).length;
                if (classLevels < requiredLevel) {
                    const displayClass = className.charAt(0).toUpperCase() + className.slice(1);
                    missing.push(`${displayClass} level ${requiredLevel} (current: ${classLevels})`);
                }
            }
        }

        // Check skill rank requirements — handle MULTIPLE skills
        // Patterns: "Tumble 5 ranks", "Tumble 5 ranks, Balance 5 ranks"
        const skillRankPattern = /([\w\s]+?)\s+(\d+)\s+ranks/gi;
        let skillMatch;
        while ((skillMatch = skillRankPattern.exec(prereqText)) !== null) {
            let skillName = skillMatch[1].trim();
            const requiredRanks = parseInt(skillMatch[2]);

            // Clean up skill name — remove leading comma/and
            skillName = skillName.replace(/^[,;\s]+/, '').replace(/^and\s+/i, '').trim();

            // Skip if this looks like it's not actually a skill name
            if (skillName.length < 2) continue;

            // Find matching skill (case-insensitive)
            const skill = Object.entries(characterData.skills).find(
                ([name, _]) => name.toLowerCase() === skillName.toLowerCase()
            );

            if (skill) {
                const [matchedName, skillData] = skill;
                const currentRanks = skillData.totalRanks || 0;
                if (currentRanks < requiredRanks) {
                    missing.push(`${matchedName} ${requiredRanks} ranks (current: ${currentRanks})`);
                }
            } else {
                // Skill not on character sheet — report as missing
                missing.push(`${skillName} ${requiredRanks} ranks`);
            }
        }

        // Deduplicate missing entries
        const uniqueMissing = [...new Set(missing)];

        return {
            qualifies: uniqueMissing.length === 0,
            missing: uniqueMissing
        };
    }

    // NEW: Get class specializations
    getClassSpecializations(className) {
        return this.dataLoader.gameData.classSpecializations.get(className) || [];
    }

    // Process flaw penalties and extract numeric effects
    processFlawPenalties(characterData) {
        const penalties = {
            ac: 0,
            touch_ac: 0,
            flatfooted_ac: 0,
            melee_attack: 0,
            ranged_attack: 0,
            fortitude: 0,
            reflex: 0,
            will: 0,
            initiative: 0,
            skill_penalties: {}
        };

        if (!characterData.flaws || characterData.flaws.length === 0) {
            return penalties;
        }

        characterData.flaws.forEach(flaw => {
            // Get full flaw data from database
            const flawData = this.dataLoader.gameData.flaws.get(flaw.name);
            const effect = flawData ? flawData.effect : (flaw.effect || '');

            if (!effect) return;

            const lowerEffect = effect.toLowerCase();

            // Parse AC penalties (use word boundaries to avoid matching "attack")
            const acMatch = lowerEffect.match(/(-\d+)\s+penalty.*?(armor class|\bac\b)/i);
            if (acMatch) {
                const penalty = parseInt(acMatch[1]);
                if (lowerEffect.includes('touch')) {
                    penalties.touch_ac += penalty;
                } else if (lowerEffect.includes('flat-footed') || lowerEffect.includes('flatfooted')) {
                    penalties.flatfooted_ac += penalty;
                } else {
                    penalties.ac += penalty;
                }
            }

            // Parse attack penalties - be more specific to avoid false matches
            const meleeAttackMatch = lowerEffect.match(/(-\d+)\s+penalty.*?(melee attack|to hit)/i);
            if (meleeAttackMatch && !lowerEffect.includes('ranged')) {
                penalties.melee_attack += parseInt(meleeAttackMatch[1]);
            }

            // Check for general attack roll penalties (applies to both melee and ranged unless specified)
            const generalAttackMatch = lowerEffect.match(/(-\d+)\s+penalty.*?\battack roll/i);
            if (generalAttackMatch && !meleeAttackMatch && !lowerEffect.includes('ranged attack roll')) {
                // If it says "all attack rolls", apply to both
                if (lowerEffect.includes('all attack')) {
                    penalties.melee_attack += parseInt(generalAttackMatch[1]);
                    penalties.ranged_attack += parseInt(generalAttackMatch[1]);
                }
            }

            const rangedAttackMatch = lowerEffect.match(/(-\d+)\s+penalty.*?ranged attack/i);
            if (rangedAttackMatch) {
                penalties.ranged_attack += parseInt(rangedAttackMatch[1]);
            }

            // Parse save penalties
            const fortMatch = lowerEffect.match(/(-\d+)\s+penalty.*?fortitude/i);
            if (fortMatch) {
                penalties.fortitude += parseInt(fortMatch[1]);
            }

            const reflexMatch = lowerEffect.match(/(-\d+)\s+penalty.*?reflex/i);
            if (reflexMatch) {
                penalties.reflex += parseInt(reflexMatch[1]);
            }

            const willMatch = lowerEffect.match(/(-\d+)\s+penalty.*?will/i);
            if (willMatch) {
                penalties.will += parseInt(willMatch[1]);
            }

            // Parse initiative penalties
            const initMatch = lowerEffect.match(/(-\d+)\s+penalty.*?initiative/i);
            if (initMatch) {
                penalties.initiative += parseInt(initMatch[1]);
            }

            // Parse skill penalties (Listen, Spot, etc.)
            const skillMatch = lowerEffect.match(/(-\d+)\s+penalty.*?(listen|spot|search|sense motive|diplomacy|bluff|intimidate|hide|move silently)/gi);
            if (skillMatch) {
                const penalty = parseInt(lowerEffect.match(/(-\d+)/)[1]);
                const skills = lowerEffect.match(/\b(listen|spot|search|sense motive|diplomacy|bluff|intimidate|hide|move silently)\b/gi);
                if (skills) {
                    skills.forEach(skill => {
                        const skillName = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
                        if (!penalties.skill_penalties[skillName]) {
                            penalties.skill_penalties[skillName] = 0;
                        }
                        penalties.skill_penalties[skillName] += penalty;
                    });
                }
            }
        });

        return penalties;
    }

    // Calculate all character stats
    calculateAll(characterData) {
        // Cache feat bonuses for this calculation cycle (avoids ~44 redundant calls)
        this._cachedFeatBonuses = this._computeFeatBonuses(characterData);

        // Process flaw penalties first
        const flawPenalties = this.processFlawPenalties(characterData);

        const abilities = this.calculateFinalAbilities(characterData);
        const bab = this.calculateBAB(characterData);
        const saves = this.calculateSaves(characterData, abilities, flawPenalties);
        const hp = this.calculateHP(characterData, abilities);
        const ac = this.calculateAC(characterData, abilities, flawPenalties);
        const initiative = this.calculateInitiative(characterData, abilities, flawPenalties);
        const attacks = this.calculateAttackBonuses(characterData, abilities, bab, flawPenalties);
        const carryingCapacity = this.calculateCarryingCapacity(abilities);
        const nextLevelXP = this.calculateNextLevelXP(characterData.level);
        const spellRanges = this.calculateSpellRanges(characterData.spells.casterLevel);

        // Calculate spells per day for primary caster class
        let spellsPerDay = Array(10).fill(0);
        const casterClasses = ['Wizard', 'Cleric', 'Druid', 'Sorcerer', 'Bard', 'Ranger', 'Paladin'];

        // Find primary caster class (first one in character's class list)
        for (const cls of characterData.classes) {
            if (casterClasses.includes(cls.className)) {
                spellsPerDay = this.getSpellsPerDay(characterData, cls.className, abilities);
                break;
            }
        }

        // Clear feat bonus cache after calculation cycle
        this._cachedFeatBonuses = null;

        return {
            abilities,
            bab,
            saves,
            hp,
            ac,
            initiative,
            attacks,
            carryingCapacity,
            nextLevelXP,
            spellRanges,
            spellsPerDay,
            flawPenalties
        };
    }
}

// Export singleton (will be initialized after dataLoader)
let calculator = null;

function initializeCalculator(dataLoaderInstance) {
    calculator = new Calculator(dataLoaderInstance);
    return calculator;
}

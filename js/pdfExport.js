// pdfExport.js - Print / PDF export layout builder

class PDFExport {
    constructor() {
        this.container = null;
    }

    // Main entry point
    print() {
        const data = character.getData();
        const stats = calculator.calculateAll(data);
        this.generatePrintLayout(data, stats);
        // Use Tauri's native print when running as desktop app, otherwise browser print
        if (window.__TAURI__) {
            window.__TAURI__.core.invoke('print_page');
        } else {
            window.print();
        }
    }

    // Build the print layout HTML
    generatePrintLayout(data, stats) {
        this.container = document.getElementById('printableSheet');
        if (!this.container) return;
        this.container.innerHTML = '';

        this.addPage1(data, stats);
        this.addPage2(data, stats);
        this.addPage3(data, stats);
        if (this.hasCasterClass(data)) {
            this.addPage4(data, stats);
        }
        this.addPage5(data, stats);
    }

    // Helper: does character have a caster class?
    hasCasterClass(data) {
        const casterClasses = ['Wizard', 'Cleric', 'Druid', 'Sorcerer', 'Bard',
            'Ranger', 'Paladin'];
        return data.classes.some(c => casterClasses.includes(c.className));
    }

    // Helper: format modifier with sign
    formatMod(val) {
        const n = parseInt(val) || 0;
        return n >= 0 ? `+${n}` : `${n}`;
    }

    // Helper: build class summary string e.g. "Fighter 5 / Wizard 3"
    classSummary(data) {
        const counts = {};
        data.classes.forEach(c => {
            counts[c.className] = (counts[c.className] || 0) + 1;
        });
        return Object.entries(counts).map(([name, lvl]) => `${name} ${lvl}`).join(' / ');
    }

    // Helper: escape HTML
    esc(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    // ================================================================
    // PAGE 1 - Character Info + Combat
    // ================================================================
    addPage1(data, stats) {
        const page = document.createElement('div');
        page.className = 'print-page';

        const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        const abilityLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

        // --- Header ---
        let html = `
        <div class="print-header">
            <h1 class="print-char-name">${this.esc(data.name)}</h1>
            <div class="print-char-subtitle">
                ${this.esc(data.race)} ${this.esc(this.classSummary(data))}
                ${data.alignment ? ' &mdash; ' + this.esc(data.alignment) : ''}
            </div>
        </div>

        <div class="print-info-row">
            <div class="print-info-item"><span class="print-label">Race</span><span class="print-value">${this.esc(data.race)}</span></div>
            <div class="print-info-item"><span class="print-label">Size</span><span class="print-value">${this.esc(data.size)}</span></div>
            <div class="print-info-item"><span class="print-label">Type</span><span class="print-value">${this.esc(data.type)}</span></div>
            <div class="print-info-item"><span class="print-label">Level</span><span class="print-value">${data.level}</span></div>
            <div class="print-info-item"><span class="print-label">XP</span><span class="print-value">${(data.inventory.experience || 0).toLocaleString()}</span></div>
            <div class="print-info-item"><span class="print-label">Alignment</span><span class="print-value">${this.esc(data.alignment || 'None')}</span></div>
        </div>`;

        // --- Ability Scores ---
        html += `<div class="print-section-title">Ability Scores</div>
        <div class="print-abilities-grid">`;

        abilityNames.forEach(ab => {
            const a = stats.abilities[ab];
            const base = data.abilities.base[ab] || 10;
            const racial = data.abilities.racial[ab] || 0;
            const magic = data.abilities.magic[ab] || 0;
            const misc = data.abilities.misc[ab] || 0;
            const temp = data.abilities.temp[ab] || 0;

            let breakdown = `Base ${base}`;
            if (racial !== 0) breakdown += `, Racial ${this.formatMod(racial)}`;
            if (magic !== 0) breakdown += `, Magic ${this.formatMod(magic)}`;
            if (misc !== 0) breakdown += `, Misc ${this.formatMod(misc)}`;
            if (temp !== 0) breakdown += `, Temp ${this.formatMod(temp)}`;

            html += `
            <div class="print-ability-box">
                <div class="print-ability-name">${abilityLabels[ab]}</div>
                <div class="print-ability-score">${a.score}</div>
                <div class="print-ability-mod">${this.formatMod(a.modifier)}</div>
                <div class="print-ability-breakdown">${breakdown}</div>
            </div>`;
        });
        html += `</div>`;

        // --- HP ---
        html += `<div class="print-two-col">
        <div class="print-col">
            <div class="print-section-title">Hit Points</div>
            <div class="print-stat-box">
                <div class="print-stat-row"><span class="print-label">Total HP</span><span class="print-value-lg">${stats.hp.total}</span></div>
                <div class="print-stat-row"><span class="print-label">Current</span><span class="print-value">${stats.hp.current}</span></div>
                <div class="print-stat-row"><span class="print-label">Temporary</span><span class="print-value">${stats.hp.temporary}</span></div>
                <div class="print-stat-row"><span class="print-label">Wounds</span><span class="print-value">${stats.hp.wounds}</span></div>
                <div class="print-stat-row"><span class="print-label">Subdual</span><span class="print-value">${stats.hp.subdual}</span></div>
            </div>
        </div>`;

        // --- AC ---
        const ac = stats.ac;
        const comp = ac.components;
        html += `<div class="print-col">
            <div class="print-section-title">Armor Class</div>
            <div class="print-stat-box">
                <div class="print-ac-totals">
                    <div class="print-ac-total-item"><span class="print-label">AC</span><span class="print-value-lg">${ac.full}</span></div>
                    <div class="print-ac-total-item"><span class="print-label">Touch</span><span class="print-value-lg">${ac.touch}</span></div>
                    <div class="print-ac-total-item"><span class="print-label">Flat-Footed</span><span class="print-value-lg">${ac.flatFooted}</span></div>
                </div>
                <div class="print-ac-components">`;

        const acParts = [
            ['Armor', comp.armor], ['Shield', comp.shield], ['Dex', comp.dex],
            ['Natural', comp.natural], ['Deflect', comp.deflect], ['Size', comp.size],
            ['Misc', comp.misc], ['Feats', comp.feats]
        ];
        acParts.forEach(([label, val]) => {
            if (val !== 0) {
                html += `<span class="print-ac-comp">${label} ${this.formatMod(val)}</span>`;
            }
        });
        html += `</div></div></div></div>`;

        // --- Saves ---
        html += `<div class="print-section-title">Saving Throws</div>
        <table class="print-table print-saves-table">
            <thead><tr><th>Save</th><th>Total</th><th>Base</th><th>Ability</th><th>Magic</th><th>Feats</th><th>Temp</th></tr></thead>
            <tbody>`;

        ['fortitude', 'reflex', 'will'].forEach(save => {
            const s = stats.saves[save];
            const labels = { fortitude: 'Fortitude', reflex: 'Reflex', will: 'Will' };
            html += `<tr>
                <td class="print-save-name">${labels[save]}</td>
                <td class="print-save-total">${this.formatMod(s.total)}</td>
                <td>${this.formatMod(s.base)}</td>
                <td>${this.formatMod(s.ability)}</td>
                <td>${this.formatMod(s.magic)}</td>
                <td>${this.formatMod(s.feats)}</td>
                <td>${this.formatMod(s.temp)}</td>
            </tr>`;
        });
        html += `</tbody></table>`;

        // --- Attack ---
        html += `<div class="print-section-title">Combat</div>
        <div class="print-combat-grid">
            <div class="print-combat-item"><span class="print-label">BAB</span><span class="print-value-lg">${this.formatMod(stats.bab)}</span></div>
            <div class="print-combat-item"><span class="print-label">Initiative</span><span class="print-value-lg">${this.formatMod(stats.initiative)}</span></div>
            <div class="print-combat-item"><span class="print-label">Grapple</span><span class="print-value-lg">${this.formatMod(stats.attacks.grapple.total)}</span></div>
            <div class="print-combat-item"><span class="print-label">Melee Attack</span><span class="print-value-lg">${this.formatMod(stats.attacks.melee.total)}</span></div>
            <div class="print-combat-item"><span class="print-label">Ranged Attack</span><span class="print-value-lg">${this.formatMod(stats.attacks.ranged.total)}</span></div>
        </div>`;

        // --- Movement & Languages ---
        html += `<div class="print-two-col">
        <div class="print-col">
            <div class="print-section-title">Movement</div>
            <div class="print-compact-list">`;
        if (data.movement.land) html += `<span>Land: ${data.movement.land} ft.</span>`;
        if (data.movement.climb) html += `<span>Climb: ${data.movement.climb} ft.</span>`;
        if (data.movement.swim) html += `<span>Swim: ${data.movement.swim} ft.</span>`;
        if (data.movement.fly) html += `<span>Fly: ${data.movement.fly} ft.</span>`;
        html += `</div></div>
        <div class="print-col">
            <div class="print-section-title">Languages</div>
            <div class="print-compact-list">
                <span>${data.languages.length > 0 ? data.languages.map(l => this.esc(l)).join(', ') : 'None'}</span>
            </div>
        </div></div>`;

        page.innerHTML = html;
        this.container.appendChild(page);
    }

    // ================================================================
    // PAGE 2 - Skills
    // ================================================================
    addPage2(data, stats) {
        const page = document.createElement('div');
        page.className = 'print-page';

        let html = `<div class="print-page-title">Skills</div>`;

        // Collect skills that have ranks or are class skills
        const skillEntries = [];
        Object.entries(data.skills).forEach(([name, skill]) => {
            const isClassSkill = calculator.isClassSkillForCharacter(data, name);
            const totalRanks = skill.totalRanks || 0;
            const abilityMod = stats.abilities[skill.ability.toLowerCase()]
                ? stats.abilities[skill.ability.toLowerCase()].modifier : 0;

            const featBonuses = stats.flawPenalties ? 0 : 0; // Placeholder
            const totalMod = calculator.calculateSkillModifier(data, name, stats.abilities, stats.flawPenalties);

            if (totalRanks > 0 || isClassSkill) {
                skillEntries.push({
                    name,
                    ability: skill.ability,
                    totalMod,
                    ranks: totalRanks,
                    abilityMod,
                    miscBonus: skill.bonus || 0,
                    isClassSkill,
                    trained: skill.trained
                });
            }
        });

        // Sort alphabetically
        skillEntries.sort((a, b) => a.name.localeCompare(b.name));

        // Split into two columns
        const midpoint = Math.ceil(skillEntries.length / 2);
        const col1 = skillEntries.slice(0, midpoint);
        const col2 = skillEntries.slice(midpoint);

        html += `<div class="print-skills-two-col">`;
        [col1, col2].forEach(col => {
            html += `<div class="print-skills-col">
            <table class="print-table print-skills-table">
                <thead><tr><th></th><th>Skill</th><th>Abil</th><th>Total</th><th>Ranks</th><th>Misc</th></tr></thead>
                <tbody>`;
            col.forEach(s => {
                const classMarker = s.isClassSkill ? '<span class="print-class-skill-marker">*</span>' : '';
                const trainedMarker = s.trained ? '<span class="print-trained-marker">T</span>' : '';
                html += `<tr>
                    <td class="print-skill-markers">${classMarker}${trainedMarker}</td>
                    <td class="print-skill-name">${this.esc(s.name)}</td>
                    <td class="print-skill-ability">${s.ability.toUpperCase()}</td>
                    <td class="print-skill-total">${this.formatMod(s.totalMod)}</td>
                    <td>${s.ranks}</td>
                    <td>${s.miscBonus !== 0 ? this.formatMod(s.miscBonus) : ''}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        });
        html += `</div>`;

        html += `<div class="print-skills-legend"><span class="print-class-skill-marker">*</span> = Class Skill &nbsp;&nbsp; <span class="print-trained-marker">T</span> = Trained Only</div>`;

        page.innerHTML = html;
        this.container.appendChild(page);
    }

    // ================================================================
    // PAGE 3 - Feats + Class Features
    // ================================================================
    addPage3(data, stats) {
        const page = document.createElement('div');
        page.className = 'print-page';

        let html = `<div class="print-page-title">Feats &amp; Features</div>`;

        // --- Feats ---
        if (data.feats && data.feats.length > 0) {
            html += `<div class="print-section-title">Feats</div>
            <table class="print-table print-feats-table">
                <thead><tr><th>Feat</th><th>Type</th><th>Prerequisite</th><th>Benefit</th></tr></thead>
                <tbody>`;

            data.feats.forEach(feat => {
                const featData = dataLoader.gameData.feats.get(feat.name);
                const type = featData ? (featData.type || 'General') : 'General';
                const prereq = featData ? (featData.prerequisite || 'None') : 'None';
                let benefit = featData ? (featData.benefit || '') : '';
                // Truncate long benefits for print
                if (benefit.length > 120) benefit = benefit.substring(0, 117) + '...';

                const choiceStr = feat.choice ? ` (${this.esc(feat.choice)})` : '';

                html += `<tr>
                    <td class="print-feat-name">${this.esc(feat.name)}${choiceStr}</td>
                    <td>${this.esc(type)}</td>
                    <td class="print-feat-prereq">${this.esc(prereq)}</td>
                    <td class="print-feat-benefit">${this.esc(benefit)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        } else {
            html += `<div class="print-section-title">Feats</div><p class="print-empty">No feats selected.</p>`;
        }

        // --- Flaws ---
        if (data.flaws && data.flaws.length > 0) {
            html += `<div class="print-section-title">Flaws</div>
            <table class="print-table">
                <thead><tr><th>Flaw</th><th>Effect</th></tr></thead>
                <tbody>`;
            data.flaws.forEach(flaw => {
                const flawData = dataLoader.gameData.flaws.get(flaw.name);
                const effect = flawData ? (flawData.effect || '') : (flaw.effect || '');
                html += `<tr>
                    <td class="print-feat-name">${this.esc(flaw.name)}</td>
                    <td>${this.esc(effect)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        // --- Class Features ---
        const classSet = {};
        data.classes.forEach(c => {
            classSet[c.className] = (classSet[c.className] || 0) + 1;
        });

        html += `<div class="print-section-title">Class Features</div>`;
        Object.entries(classSet).forEach(([className, lvl]) => {
            const classData = dataLoader.getClass(className);
            if (!classData) return;

            html += `<div class="print-class-feature-block">
                <div class="print-class-feature-title">${this.esc(className)} (Level ${lvl})</div>
                <div class="print-class-feature-details">`;

            html += `<span>Hit Die: d${classData.hitDie}</span>`;
            html += `<span>BAB: ${classData.baseAttack}</span>`;
            html += `<span>Fort: ${classData.fortSave}</span>`;
            html += `<span>Ref: ${classData.reflexSave}</span>`;
            html += `<span>Will: ${classData.willSave}</span>`;
            html += `<span>Skill Points: ${classData.skillPoints}/level</span>`;

            html += `</div></div>`;
        });

        page.innerHTML = html;
        this.container.appendChild(page);
    }

    // ================================================================
    // PAGE 4 - Spells (only if caster class)
    // ================================================================
    addPage4(data, stats) {
        const page = document.createElement('div');
        page.className = 'print-page';

        let html = `<div class="print-page-title">Spells</div>`;

        // Spell slots
        const castingAbilityLabel = { int: 'INT', wis: 'WIS', cha: 'CHA' };
        html += `<div class="print-info-row">
            <div class="print-info-item"><span class="print-label">Caster Level</span><span class="print-value">${data.spells.casterLevel}</span></div>
            <div class="print-info-item"><span class="print-label">Casting Ability</span><span class="print-value">${castingAbilityLabel[data.spells.castingAbility] || 'INT'}</span></div>
        </div>`;

        // Spell Slots summary
        html += `<div class="print-section-title">Spell Slots</div>
        <table class="print-table print-spell-slots-table">
            <thead><tr><th>Level</th>`;
        for (let i = 0; i <= 9; i++) {
            html += `<th>${i === 0 ? '0' : i}</th>`;
        }
        html += `</tr></thead><tbody>
            <tr><td class="print-label">Total</td>`;
        for (let i = 0; i <= 9; i++) {
            const total = stats.spellsPerDay[i] || 0;
            html += `<td>${total > 0 ? total : '-'}</td>`;
        }
        html += `</tr><tr><td class="print-label">Used</td>`;
        for (let i = 0; i <= 9; i++) {
            const used = data.spells.slotsUsed[i] || 0;
            const total = stats.spellsPerDay[i] || 0;
            html += `<td>${total > 0 ? used : '-'}</td>`;
        }
        html += `</tr><tr><td class="print-label">Remaining</td>`;
        for (let i = 0; i <= 9; i++) {
            const total = stats.spellsPerDay[i] || 0;
            const used = data.spells.slotsUsed[i] || 0;
            const remaining = total - used;
            html += `<td>${total > 0 ? remaining : '-'}</td>`;
        }
        html += `</tr></tbody></table>`;

        // Spell DCs
        const castAbility = data.spells.castingAbility || 'int';
        const abilityMod = stats.abilities[castAbility] ? stats.abilities[castAbility].modifier : 0;
        html += `<div class="print-section-title">Spell Save DCs</div>
        <div class="print-dc-row">`;
        for (let i = 0; i <= 9; i++) {
            if (stats.spellsPerDay[i] > 0) {
                html += `<div class="print-dc-item"><span class="print-label">Lvl ${i}</span><span class="print-value">DC ${10 + i + abilityMod}</span></div>`;
            }
        }
        html += `</div>`;

        // Known/Prepared Spells by level
        html += `<div class="print-section-title">Spells Known</div>`;
        let hasAnySpells = false;
        for (let level = 0; level <= 9; level++) {
            const spells = data.spells.spellsByLevel[level] || [];
            if (spells.length === 0) continue;
            hasAnySpells = true;

            html += `<div class="print-spell-level-block">
                <div class="print-spell-level-title">Level ${level} Spells</div>
                <table class="print-table print-spells-known-table">
                    <thead><tr><th>Prep</th><th>Name</th><th>School</th><th>Notes</th></tr></thead>
                    <tbody>`;
            spells.forEach(spell => {
                const prepMark = spell.prepared ? '[X]' : '[ ]';
                html += `<tr>
                    <td class="print-spell-prep">${prepMark}</td>
                    <td>${this.esc(spell.name)}</td>
                    <td>${this.esc(spell.school || '')}</td>
                    <td class="print-spell-notes">${this.esc(spell.notes || '')}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        }

        if (!hasAnySpells) {
            html += `<p class="print-empty">No spells known.</p>`;
        }

        page.innerHTML = html;
        this.container.appendChild(page);
    }

    // ================================================================
    // PAGE 5 - Inventory
    // ================================================================
    addPage5(data, stats) {
        const page = document.createElement('div');
        page.className = 'print-page';

        let html = `<div class="print-page-title">Inventory</div>`;

        // --- Wealth ---
        const wealth = data.inventory.wealth;
        const totalGP = (wealth.platinum * 10) + wealth.gold + (wealth.silver / 10) + (wealth.copper / 100);

        html += `<div class="print-section-title">Wealth</div>
        <div class="print-wealth-row">
            <div class="print-wealth-item"><span class="print-label">PP</span><span class="print-value">${wealth.platinum}</span></div>
            <div class="print-wealth-item"><span class="print-label">GP</span><span class="print-value">${wealth.gold}</span></div>
            <div class="print-wealth-item"><span class="print-label">SP</span><span class="print-value">${wealth.silver}</span></div>
            <div class="print-wealth-item"><span class="print-label">CP</span><span class="print-value">${wealth.copper}</span></div>
            <div class="print-wealth-item print-wealth-total"><span class="print-label">Total (GP)</span><span class="print-value">${totalGP.toFixed(2)}</span></div>
        </div>`;

        // --- Carried Items ---
        const items = data.inventory.carriedItems || [];
        html += `<div class="print-section-title">Carried Items</div>`;

        if (items.length > 0) {
            html += `<table class="print-table print-items-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Weight (lb.)</th></tr></thead>
                <tbody>`;
            items.forEach(item => {
                const qty = item.quantity || 1;
                const wt = parseFloat(item.weight) || 0;
                html += `<tr>
                    <td>${this.esc(item.name)}</td>
                    <td class="print-num">${qty}</td>
                    <td class="print-num">${(wt * qty).toFixed(1)}</td>
                </tr>`;
            });
            html += `</tbody>
            <tfoot><tr class="print-total-row">
                <td>Total Weight</td>
                <td></td>
                <td class="print-num">${(data.inventory.totalWeight || 0).toFixed(1)} lb.</td>
            </tr></tfoot></table>`;
        } else {
            html += `<p class="print-empty">No items carried.</p>`;
        }

        // --- Carrying Capacity ---
        const capacity = stats.carryingCapacity;
        html += `<div class="print-section-title">Carrying Capacity</div>
        <div class="print-capacity-row">
            <div class="print-capacity-item"><span class="print-label">Light</span><span class="print-value">&le; ${capacity.light} lb.</span></div>
            <div class="print-capacity-item"><span class="print-label">Medium</span><span class="print-value">&le; ${capacity.medium} lb.</span></div>
            <div class="print-capacity-item"><span class="print-label">Heavy</span><span class="print-value">&le; ${capacity.heavy} lb.</span></div>
            <div class="print-capacity-item"><span class="print-label">Lift</span><span class="print-value">${capacity.lift} lb.</span></div>
            <div class="print-capacity-item"><span class="print-label">Drag</span><span class="print-value">${capacity.drag} lb.</span></div>
        </div>`;

        // --- Magic Item Slots ---
        const slots = data.inventory.magicItems;
        const equippedSlots = Object.entries(slots).filter(([_, item]) => item !== null && item !== '');
        if (equippedSlots.length > 0) {
            html += `<div class="print-section-title">Magic Item Slots</div>
            <table class="print-table">
                <thead><tr><th>Slot</th><th>Item</th></tr></thead>
                <tbody>`;
            const slotLabels = {
                head: 'Head', face: 'Face', neck: 'Neck', shoulder: 'Shoulders',
                arm: 'Arms', torso: 'Torso', hand: 'Hands', leftRing: 'Left Ring',
                rightRing: 'Right Ring', armor: 'Armor', body: 'Body',
                waist: 'Waist', feet: 'Feet'
            };
            equippedSlots.forEach(([slot, item]) => {
                const label = slotLabels[slot] || slot;
                const itemName = typeof item === 'string' ? item : (item.name || 'Unknown');
                html += `<tr><td>${this.esc(label)}</td><td>${this.esc(itemName)}</td></tr>`;
            });
            html += `</tbody></table>`;
        }

        page.innerHTML = html;
        this.container.appendChild(page);
    }
}

// Export global
window.pdfExport = new PDFExport();

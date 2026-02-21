// spellsTab.js - Spells Tab UI

class SpellsTab {
    constructor() {
        this.container = document.getElementById('spellsTabContent');
        this.expandedLevels = new Set([0]); // Start with cantrips expanded
        this.currentEditLevel = null;
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Caster Configuration</h2>
                <div class="caster-config-grid">
                    <div class="form-group">
                        <label for="casterLevelInput">Caster Level</label>
                        <input type="number" id="casterLevelInput" class="form-control" min="1" max="30" value="1">
                    </div>
                    <div class="form-group">
                        <label for="castingAbilitySelect">Casting Ability</label>
                        <select id="castingAbilitySelect" class="form-control">
                            <option value="int">Intelligence</option>
                            <option value="wis">Wisdom</option>
                            <option value="cha">Charisma</option>
                        </select>
                    </div>
                </div>
                <div id="spellDCDisplay" class="spell-dc-display"></div>
                <div id="spellRangesDisplay" class="spell-ranges-display"></div>
            </div>

            <div class="card" id="spellSlotsCard">
                <h2>Spell Slots</h2>
                <p class="info-text">Shows spells per day based on your primary caster class and ability score.</p>
                <button id="resetAllSlotsBtn" class="btn btn-secondary btn-small">Reset All Slots</button>
                <div id="spellSlotsDisplay" class="spell-slots-display"></div>
            </div>

            <div class="card">
                <h2>Spell List</h2>
                <div id="spellListAccordion" class="spell-accordion">
                    <!-- Spell level sections will be added dynamically -->
                </div>
            </div>

            <!-- Modal for Adding Spells from Database -->
            <div id="addSpellDatabaseModal" class="modal-overlay hidden">
                <div class="modal-content modal-large">
                    <h2>Add Spell from Database</h2>

                    <div class="spell-search-filters">
                        <input type="text" id="spellSearch" class="form-control"
                               placeholder="Search spells..." style="width: 300px; display: inline-block;">

                        <select id="spellLevelFilter" class="form-control" style="width: 120px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Levels</option>
                            <option value="0">0 (Cantrips)</option>
                            <option value="1">1st Level</option>
                            <option value="2">2nd Level</option>
                            <option value="3">3rd Level</option>
                            <option value="4">4th Level</option>
                            <option value="5">5th Level</option>
                            <option value="6">6th Level</option>
                            <option value="7">7th Level</option>
                            <option value="8">8th Level</option>
                            <option value="9">9th Level</option>
                        </select>

                        <select id="spellSchoolFilter" class="form-control" style="width: 150px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Schools</option>
                            <option value="Abjuration">Abjuration</option>
                            <option value="Conjuration">Conjuration</option>
                            <option value="Divination">Divination</option>
                            <option value="Enchantment">Enchantment</option>
                            <option value="Evocation">Evocation</option>
                            <option value="Illusion">Illusion</option>
                            <option value="Necromancy">Necromancy</option>
                            <option value="Transmutation">Transmutation</option>
                        </select>

                        <select id="spellClassFilter" class="form-control" style="width: 150px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Classes</option>
                            <option value="Wizard">Wizard</option>
                            <option value="Sorcerer">Sorcerer</option>
                            <option value="Cleric">Cleric</option>
                            <option value="Druid">Druid</option>
                            <option value="Bard">Bard</option>
                            <option value="Paladin">Paladin</option>
                            <option value="Ranger">Ranger</option>
                        </select>
                    </div>

                    <div class="modal-database-content">
                        <div class="spell-list-container">
                            <div id="spellDatabaseList" class="spell-list">
                                <!-- Spell entries will be added dynamically -->
                            </div>
                        </div>

                        <div id="spellDatabaseDetails" class="spell-details hidden">
                            <h3 id="spellDetailName"></h3>
                            <p><strong>Level:</strong> <span id="spellDetailLevel"></span></p>
                            <p><strong>School:</strong> <span id="spellDetailSchool"></span></p>
                            <p><strong>Components:</strong> <span id="spellDetailComponents"></span></p>
                            <p><strong>Casting Time:</strong> <span id="spellDetailCastingTime"></span></p>
                            <p><strong>Range:</strong> <span id="spellDetailRange"></span></p>
                            <p><strong>Duration:</strong> <span id="spellDetailDuration"></span></p>
                            <p><strong>Saving Throw:</strong> <span id="spellDetailSave"></span></p>
                            <p><strong>Spell Resistance:</strong> <span id="spellDetailSR"></span></p>
                            <div id="spellDetailDescription"></div>

                            <div class="add-spell-options">
                                <label>
                                    <input type="checkbox" id="spellPrepareOnAdd"> Prepare spell when adding
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="confirmAddDatabaseSpell" class="btn btn-primary" disabled>Add Spell</button>
                        <button id="addCustomSpellBtn" class="btn btn-secondary">Add Custom Spell</button>
                        <button id="cancelAddDatabaseSpell" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Modal for Adding Custom Spells -->
            <div id="addSpellModal" class="modal-overlay hidden">
                <div class="modal-content">
                    <h3 id="addSpellModalTitle">Add Custom Spell</h3>
                    <div class="form-group">
                        <label for="newSpellName">Spell Name</label>
                        <input type="text" id="newSpellName" class="form-control" placeholder="Enter spell name" required>
                    </div>
                    <div class="form-group">
                        <label for="newSpellSchool">School of Magic</label>
                        <select id="newSpellSchool" class="form-control">
                            <option value="Abjuration">Abjuration</option>
                            <option value="Conjuration">Conjuration</option>
                            <option value="Divination">Divination</option>
                            <option value="Enchantment">Enchantment</option>
                            <option value="Evocation">Evocation</option>
                            <option value="Illusion">Illusion</option>
                            <option value="Necromancy">Necromancy</option>
                            <option value="Transmutation">Transmutation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newSpellNotes">Notes (Optional)</label>
                        <textarea id="newSpellNotes" class="form-control" rows="3" placeholder="Spell description, effects, etc."></textarea>
                    </div>
                    <div class="modal-footer">
                        <button id="saveNewSpell" class="btn btn-primary">Add Spell</button>
                        <button id="cancelAddSpell" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Caster level change
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'casterLevelInput') {
                const level = parseInt(e.target.value) || 1;
                character.updateCasterLevel(level);
            } else if (e.target.id === 'castingAbilitySelect') {
                const ability = e.target.value;
                character.updateCastingAbility(ability);
            }
        });

        // Reset all slots button
        this.container.addEventListener('click', async (e) => {
            if (e.target.id === 'resetAllSlotsBtn') {
                const confirmed = await InfoModal.confirm('Reset all spell slots to full?', 'Reset Spell Slots');
                if (confirmed) {
                    character.resetSpellSlots();
                }
            }
        });

        // Slot usage buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('use-slot-btn')) {
                const level = parseInt(e.target.dataset.level);
                character.castSpell(level);
            } else if (e.target.classList.contains('restore-slot-btn')) {
                const level = parseInt(e.target.dataset.level);
                const data = character.getData();
                const currentUsed = data.spells.slotsUsed[level] || 0;
                if (currentUsed > 0) {
                    character.updateSpellSlotUsage(level, currentUsed - 1);
                }
            }
        });

        // Accordion toggle
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('spell-level-header')) {
                const level = parseInt(e.target.dataset.level);
                this.toggleAccordion(level);
            }
        });

        // Add spell button - opens database modal
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-spell-btn')) {
                const level = parseInt(e.target.dataset.level);
                this.openSpellDatabaseModal(level);
            }
        });

        // Delete spell button
        this.container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-spell-btn')) {
                const level = parseInt(e.target.dataset.level);
                const index = parseInt(e.target.dataset.index);
                const confirmed = await InfoModal.confirm('Delete this spell?', 'Delete Spell', { confirmText: 'Delete', danger: true });
                if (confirmed) {
                    character.removeSpell(level, index);
                }
            }
        });

        // Toggle prepared checkbox
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('spell-prepared-checkbox')) {
                const level = parseInt(e.target.dataset.level);
                const index = parseInt(e.target.dataset.index);
                const prepared = e.target.checked;
                character.toggleSpellPrepared(level, index, prepared);
            }
        });

        // Database modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmAddDatabaseSpell') {
                this.addSpellFromDatabase();
            } else if (e.target.id === 'cancelAddDatabaseSpell') {
                this.closeSpellDatabaseModal();
            } else if (e.target.id === 'addCustomSpellBtn') {
                this.closeSpellDatabaseModal();
                this.openAddSpellModal(this.currentEditLevel);
            } else if (e.target.closest('.spell-database-entry')) {
                const spellEntry = e.target.closest('.spell-database-entry');
                this.selectDatabaseSpell(spellEntry.dataset.spellName);
            } else if (e.target.id === 'saveNewSpell') {
                this.saveNewSpell();
            } else if (e.target.id === 'cancelAddSpell') {
                this.closeAddSpellModal();
            }
        });

        // Search and filters for database
        document.addEventListener('input', (e) => {
            if (e.target.id === 'spellSearch') {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderSpellDatabaseList();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'spellLevelFilter') {
                this.levelFilter = e.target.value;
                this.renderSpellDatabaseList();
            } else if (e.target.id === 'spellSchoolFilter') {
                this.schoolFilter = e.target.value;
                this.renderSpellDatabaseList();
            } else if (e.target.id === 'spellClassFilter') {
                this.classFilter = e.target.value;
                this.renderSpellDatabaseList();
            }
        });
    }

    toggleAccordion(level) {
        if (this.expandedLevels.has(level)) {
            this.expandedLevels.delete(level);
        } else {
            this.expandedLevels.add(level);
        }
        this.renderSpellAccordion();
    }

    // NEW: Open spell database modal
    openSpellDatabaseModal(level) {
        this.currentEditLevel = level;
        this.searchTerm = '';
        this.levelFilter = level.toString();
        this.schoolFilter = 'all';
        this.classFilter = 'all';
        this.selectedDatabaseSpell = null;

        document.getElementById('spellSearch').value = '';
        document.getElementById('spellLevelFilter').value = level.toString();
        document.getElementById('spellSchoolFilter').value = 'all';
        document.getElementById('spellClassFilter').value = 'all';
        document.getElementById('spellDatabaseDetails').classList.add('hidden');
        document.getElementById('confirmAddDatabaseSpell').disabled = true;
        document.getElementById('spellPrepareOnAdd').checked = false;

        document.getElementById('addSpellDatabaseModal').classList.remove('hidden');
        this.renderSpellDatabaseList();
    }

    // NEW: Close spell database modal
    closeSpellDatabaseModal() {
        document.getElementById('addSpellDatabaseModal').classList.add('hidden');
        this.selectedDatabaseSpell = null;
    }

    // NEW: Render spell database list
    renderSpellDatabaseList() {
        const list = document.getElementById('spellDatabaseList');
        if (!list) return;

        const data = character.getData();
        const allSpells = Array.from(dataLoader.gameData.spells.values());

        // Filter spells
        const filteredSpells = allSpells.filter(spell => {
            // Search filter
            if (this.searchTerm && !spell.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }

            // School filter
            if (this.schoolFilter !== 'all' && spell.school !== this.schoolFilter) {
                return false;
            }

            // Class filter - check if spell has the selected class
            if (this.classFilter !== 'all') {
                if (!spell.levels || !spell.levels.hasOwnProperty(this.classFilter)) {
                    return false;
                }
            }

            // Level filter - check if spell is available at this level for any class
            if (this.levelFilter !== 'all') {
                const targetLevel = parseInt(this.levelFilter);
                if (!spell.levels) return false;

                const hasLevel = Object.values(spell.levels).some(level => level === targetLevel);
                if (!hasLevel) return false;
            }

            return true;
        });

        // Sort by name
        filteredSpells.sort((a, b) => a.name.localeCompare(b.name));

        list.innerHTML = '';

        if (filteredSpells.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 20px;">No spells found matching filters.</p>';
            return;
        }

        filteredSpells.forEach(spell => {
            const entry = document.createElement('div');
            entry.className = 'spell-database-entry';
            entry.dataset.spellName = spell.name;

            // Get level information
            let levelText = 'Multiple levels';
            if (spell.levels && Object.keys(spell.levels).length > 0) {
                const levelPairs = Object.entries(spell.levels)
                    .map(([cls, lvl]) => `${cls} ${lvl}`)
                    .slice(0, 3);
                levelText = levelPairs.join(', ');
                if (Object.keys(spell.levels).length > 3) {
                    levelText += '...';
                }
            }

            entry.innerHTML = `
                <div class="spell-entry-header">
                    <strong>${spell.name}</strong>
                    <span class="spell-school-badge">${spell.school}</span>
                </div>
                <div class="spell-entry-level">${levelText}</div>
            `;

            list.appendChild(entry);
        });
    }

    // NEW: Select spell from database
    selectDatabaseSpell(spellName) {
        this.selectedDatabaseSpell = spellName;
        const spellData = dataLoader.gameData.spells.get(spellName);
        if (!spellData) return;

        const detailsPanel = document.getElementById('spellDatabaseDetails');
        detailsPanel.classList.remove('hidden');

        document.getElementById('spellDetailName').textContent = spellData.name;

        // Level by class
        let levelText = 'Not available';
        if (spellData.levels && Object.keys(spellData.levels).length > 0) {
            levelText = Object.entries(spellData.levels)
                .map(([cls, lvl]) => `${cls} ${lvl}`)
                .join(', ');
        }
        document.getElementById('spellDetailLevel').textContent = levelText;

        document.getElementById('spellDetailSchool').textContent = spellData.school || 'Unknown';
        document.getElementById('spellDetailComponents').textContent = spellData.components || 'N/A';
        document.getElementById('spellDetailCastingTime').textContent = spellData.castingTime || 'N/A';
        document.getElementById('spellDetailRange').textContent = spellData.range || 'N/A';
        document.getElementById('spellDetailDuration').textContent = spellData.duration || 'N/A';
        document.getElementById('spellDetailSave').textContent = spellData.savingThrow || 'None';
        document.getElementById('spellDetailSR').textContent = spellData.spellResistance || 'No';

        // Show description
        const description = spellData.description ? spellData.description.replace(/<[^>]*>/g, '').trim() :
                          spellData.fullText ? spellData.fullText.replace(/<[^>]*>/g, '').trim() : '';
        if (description) {
            document.getElementById('spellDetailDescription').innerHTML = `<p><strong>Description:</strong></p><p>${description}</p>`;
        } else {
            document.getElementById('spellDetailDescription').innerHTML = '<p>No description available.</p>';
        }

        // Enable add button
        document.getElementById('confirmAddDatabaseSpell').disabled = false;

        // Highlight selected spell
        document.querySelectorAll('.spell-database-entry').forEach(entry => {
            if (entry.dataset.spellName === spellName) {
                entry.classList.add('spell-entry-selected');
            } else {
                entry.classList.remove('spell-entry-selected');
            }
        });
    }

    // NEW: Add spell from database
    addSpellFromDatabase() {
        if (!this.selectedDatabaseSpell) return;

        const spellData = dataLoader.gameData.spells.get(this.selectedDatabaseSpell);
        if (!spellData) return;

        const prepareOnAdd = document.getElementById('spellPrepareOnAdd').checked;

        character.addSpell(this.currentEditLevel, {
            name: spellData.name,
            source: 'database',
            spellId: spellData.name,
            school: spellData.school,
            prepared: prepareOnAdd,
            notes: ''
        });

        this.closeSpellDatabaseModal();
    }

    openAddSpellModal(level) {
        this.currentEditLevel = level;
        document.getElementById('addSpellModalTitle').textContent = `Add Level ${level} Spell`;
        document.getElementById('newSpellName').value = '';
        document.getElementById('newSpellSchool').value = 'Evocation';
        document.getElementById('newSpellNotes').value = '';
        document.getElementById('addSpellModal').classList.remove('hidden');
        document.getElementById('newSpellName').focus();
    }

    closeAddSpellModal() {
        document.getElementById('addSpellModal').classList.add('hidden');
        this.currentEditLevel = null;
    }

    saveNewSpell() {
        const name = document.getElementById('newSpellName').value.trim();
        const school = document.getElementById('newSpellSchool').value;
        const notes = document.getElementById('newSpellNotes').value.trim();

        if (!name) {
            InfoModal.toast('Please enter a spell name.', 'warning');
            return;
        }

        character.addSpell(this.currentEditLevel, {
            name,
            school,
            notes
        });

        this.closeAddSpellModal();
    }

    render(stats) {
        if (!stats) return;

        const data = character.getData();

        // Update caster level input
        document.getElementById('casterLevelInput').value = data.spells.casterLevel || 1;

        // Update casting ability select
        document.getElementById('castingAbilitySelect').value = data.spells.castingAbility || 'int';

        // Update spell DCs display
        this.renderSpellDCs(stats, data);

        // Update spell ranges display
        this.renderSpellRanges(stats);

        // Update spell slots display
        this.renderSpellSlots(stats, data);

        // Render spell accordion
        this.renderSpellAccordion();
    }

    renderSpellDCs(stats, data) {
        const castingAbility = data.spells.castingAbility || 'int';
        const abilityMod = stats.abilities[castingAbility].modifier;

        let dcHTML = '<h3>Spell Save DCs</h3><div class="spell-dc-grid">';

        for (let level = 0; level <= 9; level++) {
            const dc = 10 + level + abilityMod;
            dcHTML += `<div class="dc-item"><strong>Level ${level}:</strong> DC ${dc}</div>`;
        }

        dcHTML += '</div>';
        document.getElementById('spellDCDisplay').innerHTML = dcHTML;
    }

    renderSpellRanges(stats) {
        const ranges = stats.spellRanges;
        const html = `
            <h3>Spell Ranges</h3>
            <div class="spell-ranges-grid">
                <div><strong>Close:</strong> ${ranges.close} ft</div>
                <div><strong>Medium:</strong> ${ranges.medium} ft</div>
                <div><strong>Long:</strong> ${ranges.long} ft</div>
            </div>
        `;
        document.getElementById('spellRangesDisplay').innerHTML = html;
    }

    renderSpellSlots(stats, data) {
        const spellsPerDay = stats.spellsPerDay || Array(10).fill(0);
        const hasCasterClass = spellsPerDay.some(slots => slots > 0);

        if (!hasCasterClass) {
            document.getElementById('spellSlotsDisplay').innerHTML = `
                <p class="info-text">No caster class detected. Add a Wizard, Cleric, Druid, Sorcerer, Bard, Ranger, or Paladin level to see spell slots.</p>
            `;
            return;
        }

        // Get slot usage data
        const slotsUsed = data.spells.slotsUsed || {};

        // Count prepared spells per level
        const preparedCount = Array(10).fill(0);
        for (let level = 0; level <= 9; level++) {
            const spells = data.spells.spellsByLevel[level] || [];
            preparedCount[level] = spells.filter(s => s.prepared).length;
        }

        let html = '<div class="spell-slots-grid">';

        for (let level = 0; level <= 9; level++) {
            const total = spellsPerDay[level];
            const prepared = preparedCount[level];
            const used = slotsUsed[level] || 0;
            const remaining = total - used;

            if (total === 0) continue; // Skip levels not yet available

            const usedPercentage = total > 0 ? (used / total) * 100 : 0;
            let statusClass = 'available';
            if (used >= total) {
                statusClass = 'depleted';
            } else if (used > 0) {
                statusClass = 'partial';
            }

            html += `
                <div class="spell-slot-item ${statusClass}">
                    <div class="slot-header">
                        <strong>Level ${level}${level === 0 ? ' (Cantrips)' : ''}</strong>
                    </div>
                    <div class="slot-usage-info">
                        <div class="slot-count">
                            <span class="used-count">${used}</span> used /
                            <span class="total-count">${total}</span> total
                            <span class="remaining-count">(${remaining} remaining)</span>
                        </div>
                        <div class="slot-prepared">
                            ${prepared} prepared
                            ${prepared > total ? `<span class="error-text"> (overprepared by ${prepared - total})</span>` : ''}
                        </div>
                    </div>
                    <div class="slot-bar-container">
                        <div class="slot-bar-used" style="width: ${Math.min(100, usedPercentage)}%"></div>
                    </div>
                    <div class="slot-controls">
                        <button class="btn btn-small use-slot-btn" data-level="${level}" ${remaining <= 0 ? 'disabled' : ''}>
                            Use Slot
                        </button>
                        <button class="btn btn-small restore-slot-btn" data-level="${level}" ${used <= 0 ? 'disabled' : ''}>
                            Restore Slot
                        </button>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        document.getElementById('spellSlotsDisplay').innerHTML = html;
    }

    renderSpellAccordion() {
        const data = character.getData();
        const stats = calculator.calculateAll(data);
        const castingAbility = data.spells.castingAbility || 'int';
        const abilityMod = stats.abilities[castingAbility].modifier;

        const accordion = document.getElementById('spellListAccordion');
        accordion.innerHTML = '';

        // Get spells per day for slot capacity info
        const spellsPerDay = stats.spellsPerDay || Array(10).fill(0);

        for (let level = 0; level <= 9; level++) {
            const spells = data.spells.spellsByLevel[level] || [];
            const isExpanded = this.expandedLevels.has(level);
            const preparedCount = spells.filter(s => s.prepared).length;
            const slotsTotal = spellsPerDay[level] || 0;
            const slotsUsed = (data.spells.slotsUsed || {})[level] || 0;
            const slotsRemaining = slotsTotal - slotsUsed;

            // Determine if this level is full (prepared >= slots per day)
            const isFull = slotsTotal > 0 && preparedCount >= slotsTotal;

            const section = document.createElement('div');
            section.className = 'spell-level-section';

            // Build remaining slots indicator
            let remainingIndicator = '';
            if (slotsTotal > 0) {
                remainingIndicator = ` | ${slotsRemaining}/${slotsTotal} slots remaining`;
                if (isFull) {
                    remainingIndicator += ' (FULL)';
                }
            }

            // Header
            const header = document.createElement('div');
            header.className = `spell-level-header ${isExpanded ? 'expanded' : ''} ${isFull ? 'spell-level-full' : ''}`;
            header.dataset.level = level;
            header.innerHTML = `
                <span class="spell-level-title">
                    ${level === 0 ? 'Cantrips (Level 0)' : `Level ${level} Spells`}
                    <span class="spell-count">(${spells.length} known, ${preparedCount} prepared${remainingIndicator})</span>
                    ${isFull ? '<span class="spell-full-badge">FULL</span>' : ''}
                </span>
                <span class="accordion-icon">${isExpanded ? '▼' : '▶'}</span>
            `;

            section.appendChild(header);

            // Content
            if (isExpanded) {
                const content = document.createElement('div');
                content.className = 'spell-level-content';

                // Add spell button
                const addButton = document.createElement('button');
                addButton.className = 'btn btn-primary btn-small add-spell-btn';
                addButton.dataset.level = level;
                addButton.textContent = 'Add Spell';
                content.appendChild(addButton);

                // Spells table
                if (spells.length > 0) {
                    const table = document.createElement('table');
                    table.className = 'spells-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Spell Name</th>
                                <th>School</th>
                                <th>DC</th>
                                <th>Prepared</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${spells.map((spell, index) => {
                                const dc = 10 + level + abilityMod;
                                return `
                                    <tr>
                                        <td>
                                            <strong>${spell.name}</strong>
                                            ${spell.notes ? `<br><small class="spell-notes">${spell.notes}</small>` : ''}
                                        </td>
                                        <td>${spell.school}</td>
                                        <td>${dc}</td>
                                        <td>
                                            <input type="checkbox"
                                                   class="spell-prepared-checkbox"
                                                   data-level="${level}"
                                                   data-index="${index}"
                                                   ${spell.prepared ? 'checked' : ''}>
                                        </td>
                                        <td>
                                            <button class="btn btn-small btn-danger delete-spell-btn"
                                                    data-level="${level}"
                                                    data-index="${index}">Delete</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    `;
                    content.appendChild(table);
                } else {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.className = 'info-text';
                    emptyMsg.textContent = `No level ${level} spells added yet.`;
                    content.appendChild(emptyMsg);
                }

                section.appendChild(content);
            }

            accordion.appendChild(section);
        }
    }
}

window.SpellsTab = SpellsTab;

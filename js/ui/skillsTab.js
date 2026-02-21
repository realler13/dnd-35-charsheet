// skillsTab.js - Skills Tab UI

class SkillsTab {
    constructor() {
        this.container = document.getElementById('skillsTabContent');
        this.selectedLevel = 1;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.currentSkill = null; // For modal
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Skill Points Summary</h2>
                <div id="overallSkillPoints" class="overall-skill-points"></div>
                <div class="skill-points-controls">
                    <label>
                        View Level:
                        <select id="skillLevelSelect" class="form-control">
                            <option value="1">Level 1</option>
                        </select>
                    </label>
                    <div id="skillPointsSummary" class="skill-points-summary"></div>
                </div>
            </div>

            <div class="card">
                <h2>Skills</h2>

                <!-- Legend -->
                <div class="skills-legend">
                    <div class="legend-title">Legend:</div>
                    <div class="legend-items">
                        <span class="legend-item"><span class="trained-only">*</span> = Trained Only (requires at least 1 rank)</span>
                        <span class="legend-item"><span class="class-skill-badge">★</span> = Class Skill (1 point per rank)</span>
                        <span class="legend-item">Cross-Class (2 points per rank)</span>
                        <span class="legend-item"><span class="skill-focus-badge">🌟</span> = Skill Focus feat (+3 bonus)</span>
                    </div>
                </div>

                <div class="skills-controls">
                    <input type="text" id="skillSearch" class="form-control" placeholder="Search skills..." style="width: 250px; display: inline-block;">
                    <select id="skillFilter" class="form-control" style="width: 200px; display: inline-block; margin-left: 10px;">
                        <option value="all">All Skills</option>
                        <option value="class">Class Skills Only</option>
                        <option value="cross-class">Cross-Class Only</option>
                    </select>
                </div>

                <div class="skills-table-container">
                    <table class="skills-table">
                        <thead>
                            <tr>
                                <th>Skill</th>
                                <th>Ability</th>
                                <th>Class?</th>
                                <th>Total Ranks</th>
                                <th>Modifier</th>
                                <th>Misc Bonus</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="skillsTableBody">
                            <!-- Skills will be added dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal for Rank Allocation -->
            <div id="skillRankModal" class="modal-overlay hidden">
                <div class="modal-content">
                    <h3 id="modalSkillName">Skill Name</h3>
                    <p id="modalSkillInfo" class="info-text"></p>
                    <div id="modalRanksGrid" class="ranks-grid"></div>
                    <div id="modalValidation" class="validation-message hidden"></div>
                    <div class="modal-footer">
                        <button id="saveSkillRanks" class="btn btn-primary">Save</button>
                        <button id="cancelSkillModal" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Level selector
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'skillLevelSelect') {
                this.selectedLevel = parseInt(e.target.value);
                this.updateSkillPointsSummary();
                this.updateOverallSkillPoints();
            }
        });

        // Search and filter
        this.container.addEventListener('input', (e) => {
            if (e.target.id === 'skillSearch') {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderSkillsTable();
            }
        });

        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'skillFilter') {
                this.currentFilter = e.target.value;
                this.renderSkillsTable();
            }
        });

        // Edit button clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-skill-btn')) {
                const skillName = e.target.dataset.skill;
                this.openRankModal(skillName);
            }
        });

        // Misc bonus changes (inline editing)
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('skill-bonus-input')) {
                const skillName = e.target.dataset.skill;
                const bonus = parseInt(e.target.value) || 0;
                character.updateSkillBonus(skillName, bonus);
            }
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'saveSkillRanks') {
                this.saveSkillRanks();
            } else if (e.target.id === 'cancelSkillModal') {
                this.closeRankModal();
            } else if (e.target.id === 'skillRankModal') {
                // Clicking overlay does nothing (user preference)
            }
        });

        // Real-time validation in modal
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('skill-rank-input')) {
                this.validateRankInput(e.target);
            }
        });
    }

    render(stats) {
        if (!stats) return;

        this.stats = stats;
        const data = character.getData();

        // Update level selector options
        const levelSelect = document.getElementById('skillLevelSelect');
        if (levelSelect) {
            levelSelect.innerHTML = '';
            for (let i = 1; i <= data.level; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Level ${i}`;
                if (i === this.selectedLevel && i <= data.level) {
                    option.selected = true;
                } else if (this.selectedLevel > data.level) {
                    this.selectedLevel = data.level;
                    if (i === data.level) option.selected = true;
                }
                levelSelect.appendChild(option);
            }
        }

        this.updateSkillPointsSummary();
        this.updateOverallSkillPoints();
        this.renderSkillsTable();
    }

    updateOverallSkillPoints() {
        const data = character.getData();
        const summary = document.getElementById('overallSkillPoints');
        if (!summary) return;

        if (data.level === 0) {
            summary.innerHTML = '<p class="info-text">No character levels yet.</p>';
            return;
        }

        // Calculate total points across all levels
        let totalAvailable = 0;
        let totalSpent = 0;

        for (let level = 1; level <= data.level; level++) {
            const pointsData = calculator.calculateAvailableSkillPoints(data, level);
            totalAvailable += pointsData.total;
            totalSpent += pointsData.spent;
        }

        const totalRemaining = totalAvailable - totalSpent;

        let statusClass = 'available';
        if (totalRemaining === 0) {
            statusClass = 'full';
        } else if (totalRemaining < 0) {
            statusClass = 'overspent';
        }

        summary.innerHTML = `
            <div class="overall-points-display ${statusClass}">
                <div class="overall-points-title">Total Across All Levels (1-${data.level})</div>
                <div class="overall-points-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Available:</span>
                        <span class="stat-value">${totalAvailable}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Spent:</span>
                        <span class="stat-value">${totalSpent}</span>
                    </div>
                    <div class="stat-item ${totalRemaining < 0 ? 'overspent' : ''}">
                        <span class="stat-label">Total Remaining:</span>
                        <span class="stat-value ${totalRemaining < 0 ? 'negative' : ''}">${totalRemaining}</span>
                    </div>
                </div>
                ${totalRemaining < 0 ? '<div class="warning-text">⚠ You have overspent skill points!</div>' : ''}
            </div>
        `;
    }

    updateSkillPointsSummary() {
        const data = character.getData();
        const summary = document.getElementById('skillPointsSummary');
        if (!summary) return;

        if (data.level === 0 || !data.classes[this.selectedLevel - 1]) {
            summary.innerHTML = '<p class="info-text">No class selected for this level.</p>';
            return;
        }

        const pointsData = calculator.calculateAvailableSkillPoints(data, this.selectedLevel);

        let statusClass = 'available';
        if (pointsData.remaining === 0) {
            statusClass = 'full';
        } else if (pointsData.remaining < 0) {
            statusClass = 'overspent';
        }

        summary.innerHTML = `
            <div class="skill-points-display ${statusClass}">
                <strong>Level ${this.selectedLevel} Breakdown:</strong>
                <span>Available: ${pointsData.total}</span> |
                <span>Spent: ${pointsData.spent}</span> |
                <span class="${pointsData.remaining < 0 ? 'negative' : ''}">Remaining: ${pointsData.remaining}</span>
            </div>
        `;
    }

    renderSkillsTable() {
        const tbody = document.getElementById('skillsTableBody');
        if (!tbody) return;

        const data = character.getData();
        const stats = this.stats || calculator.calculateAll(data);
        tbody.innerHTML = '';

        // Get all skills
        const skills = Object.entries(data.skills);

        // Filter and search
        const filteredSkills = skills.filter(([skillName, skillData]) => {
            // Search filter
            if (this.searchTerm && !skillName.toLowerCase().includes(this.searchTerm)) {
                return false;
            }

            // Class skill filter
            if (this.currentFilter === 'class') {
                const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
                if (!isClassSkill) return false;
            } else if (this.currentFilter === 'cross-class') {
                const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
                if (isClassSkill) return false;
            }

            return true;
        });

        // Sort by skill name
        filteredSkills.sort((a, b) => a[0].localeCompare(b[0]));

        // Render rows
        filteredSkills.forEach(([skillName, skillData]) => {
            const row = this.createSkillRow(skillName, skillData, stats);
            tbody.appendChild(row);
        });

        if (filteredSkills.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No skills found.</td></tr>';
        }
    }

    createSkillRow(skillName, skillData, stats) {
        const row = document.createElement('tr');
        const data = character.getData();

        const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
        const totalModifier = calculator.calculateSkillModifier(data, skillName, stats.abilities, stats.flawPenalties);

        // NEW: Check for Skill Focus feat
        const hasSkillFocus = data.feats && data.feats.some(feat =>
            feat.name === `Skill Focus (${skillName})` ||
            (feat.name === 'Skill Focus' && feat.details === skillName)
        );

        // NEW: Add styling for Skill Focus
        const rowClass = hasSkillFocus ? 'skill-focus-highlight' : '';
        if (rowClass) {
            row.classList.add(rowClass);
        }

        row.innerHTML = `
            <td>
                <strong>${skillName}</strong>
                ${skillData.trained ? ' <span class="trained-only" title="Trained Only">*</span>' : ''}
                ${hasSkillFocus ? ' <span class="skill-focus-badge" title="Skill Focus (+3 bonus)">🌟</span>' : ''}
            </td>
            <td>${skillData.ability}</td>
            <td>${isClassSkill ? '<span class="class-skill-badge" title="Class Skill">★</span>' : ''}</td>
            <td>${skillData.totalRanks}</td>
            <td>${totalModifier >= 0 ? '+' : ''}${totalModifier}${hasSkillFocus ? ' <span class="skill-focus-note" title="Includes +3 from Skill Focus">(+3)</span>' : ''}</td>
            <td>
                <input type="number" class="form-control skill-bonus-input"
                       data-skill="${skillName}"
                       value="${skillData.bonus || 0}"
                       style="width: 60px;">
            </td>
            <td>
                <button class="btn btn-small edit-skill-btn" data-skill="${skillName}">Edit Ranks</button>
            </td>
        `;

        return row;
    }

    openRankModal(skillName) {
        const data = character.getData();
        const skillData = data.skills[skillName];
        if (!skillData) return;

        this.currentSkill = skillName;
        const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);

        // Set modal title
        document.getElementById('modalSkillName').textContent = `${skillName} - ${skillData.ability}`;
        document.getElementById('modalSkillInfo').textContent =
            `${isClassSkill ? 'Class Skill' : 'Cross-Class Skill'} (${isClassSkill ? '1 pt per rank' : '2 pts per rank'})`;

        // Build ranks grid
        const ranksGrid = document.getElementById('modalRanksGrid');
        ranksGrid.innerHTML = '<div class="ranks-grid-header"><strong>Level</strong><strong>Ranks</strong><strong>Max</strong><strong>Cost</strong></div>';

        for (let level = 1; level <= data.level; level++) {
            const currentRanks = skillData.ranks[level - 1] || 0;
            const maxRanks = calculator.calculateMaxSkillRanks(data, skillName, level);
            const cost = currentRanks * (isClassSkill ? 1 : 2);

            const rankRow = document.createElement('div');
            rankRow.className = 'rank-row';
            rankRow.innerHTML = `
                <span class="rank-level">Level ${level}</span>
                <input type="number"
                       class="form-control skill-rank-input"
                       data-level="${level}"
                       data-skill="${skillName}"
                       value="${currentRanks}"
                       min="0"
                       max="${maxRanks}">
                <span class="rank-max">/ ${maxRanks}</span>
                <span class="rank-cost">${cost} pts</span>
            `;
            ranksGrid.appendChild(rankRow);
        }

        // Show modal
        document.getElementById('skillRankModal').classList.remove('hidden');
    }

    closeRankModal() {
        document.getElementById('skillRankModal').classList.add('hidden');
        this.currentSkill = null;
        document.getElementById('modalValidation').classList.add('hidden');
    }

    validateRankInput(input) {
        const level = parseInt(input.dataset.level);
        const skillName = input.dataset.skill;
        const ranks = parseInt(input.value) || 0;
        const data = character.getData();

        const maxRanks = calculator.calculateMaxSkillRanks(data, skillName, level);

        // Validate max ranks
        if (ranks > maxRanks) {
            input.value = maxRanks;
            this.showValidationError(`Max ranks at level ${level}: ${maxRanks}`);
            return false;
        }

        // Update cost display
        const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
        const cost = ranks * (isClassSkill ? 1 : 2);
        const costSpan = input.closest('.rank-row').querySelector('.rank-cost');
        if (costSpan) {
            costSpan.textContent = `${cost} pts`;
        }

        // Validate total points for this level
        this.validateLevelPoints(level);
        return true;
    }

    validateLevelPoints(level) {
        const data = character.getData();
        const modal = document.getElementById('modalRanksGrid');
        if (!modal) return;

        // Calculate points spent with current modal values
        let totalSpent = 0;
        const inputs = modal.querySelectorAll(`.skill-rank-input[data-level="${level}"]`);

        inputs.forEach(input => {
            const skillName = input.dataset.skill;
            const ranks = parseInt(input.value) || 0;
            const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
            totalSpent += ranks * (isClassSkill ? 1 : 2);
        });

        // Add points from other skills
        Object.entries(data.skills).forEach(([skillName, skillData]) => {
            if (skillName !== this.currentSkill) {
                const ranks = skillData.ranks[level - 1] || 0;
                const isClassSkill = calculator.isClassSkillForCharacter(data, skillName);
                totalSpent += ranks * (isClassSkill ? 1 : 2);
            }
        });

        const pointsData = calculator.calculateAvailableSkillPoints(data, level);
        const remaining = pointsData.total - totalSpent;

        if (remaining < 0) {
            this.showValidationError(`Level ${level}: ${Math.abs(remaining)} points overspent!`);
            return false;
        } else {
            document.getElementById('modalValidation').classList.add('hidden');
            return true;
        }
    }

    showValidationError(message) {
        const validation = document.getElementById('modalValidation');
        validation.textContent = message;
        validation.classList.remove('hidden');
    }

    saveSkillRanks() {
        if (!this.currentSkill) return;

        const data = character.getData();
        const modal = document.getElementById('modalRanksGrid');
        const inputs = modal.querySelectorAll('.skill-rank-input');

        // Validate all levels before saving
        let hasError = false;
        for (let level = 1; level <= data.level; level++) {
            if (!this.validateLevelPoints(level)) {
                hasError = true;
                break;
            }
        }

        if (hasError) {
            return; // Don't save if there are validation errors
        }

        // Save all ranks
        inputs.forEach(input => {
            const level = parseInt(input.dataset.level);
            const ranks = parseInt(input.value) || 0;
            character.updateSkillRanks(this.currentSkill, level, ranks);
        });

        this.closeRankModal();
        this.updateOverallSkillPoints(); // Refresh overall totals
    }
}

window.SkillsTab = SkillsTab;

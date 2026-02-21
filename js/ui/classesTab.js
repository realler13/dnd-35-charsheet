// classesTab.js - Classes Tab UI and Logic

class ClassesTab {
    constructor() {
        this.container = document.getElementById('classesTabContent');
        this.maxLevels = 20;
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Character Classes</h2>
                <p class="info-text">Select a class for each level. HP and skill points are calculated automatically based on your choices.</p>

                <div class="classes-table-container">
                    <table class="classes-table">
                        <thead>
                            <tr>
                                <th>Level</th>
                                <th>Class</th>
                                <th>Specialization</th>
                                <th>Hit Die</th>
                                <th>HP Roll</th>
                                <th>Skill Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="classesTableBody">
                            <!-- Levels will be added dynamically -->
                        </tbody>
                    </table>
                </div>

                <div class="class-actions">
                    <button id="addClassLevel" class="btn btn-primary">Add Level</button>
                </div>
            </div>

            <div class="card">
                <h2>Class Summary</h2>
                <div id="classSummary" class="class-summary"></div>
            </div>
        `;

        this.renderClassRows();
    }

    renderClassRows() {
        const tbody = document.getElementById('classesTableBody');
        const data = character.getData();
        const currentLevel = data.level || 0;

        tbody.innerHTML = '';

        // Show rows for current level + 1 (to add next level)
        const rowsToShow = Math.min(currentLevel + 1, this.maxLevels);

        for (let level = 1; level <= rowsToShow; level++) {
            const classData = data.classes[level - 1];
            const row = this.createClassRow(level, classData);
            tbody.appendChild(row);
        }
    }

    createClassRow(level, classData) {
        const row = document.createElement('tr');
        row.dataset.level = level;

        const isExisting = !!classData;

        row.innerHTML = `
            <td class="level-number">${level}</td>
            <td>
                <select class="class-select" data-level="${level}" ${isExisting ? '' : 'required'}>
                    <option value="">Select Class</option>
                </select>
            </td>
            <td>
                <select class="specialization-select" data-level="${level}" ${isExisting ? '' : 'disabled'}>
                    <option value="">None</option>
                </select>
            </td>
            <td class="hit-die" data-level="${level}">${classData ? classData.hitDie : '-'}</td>
            <td>
                <input type="number" class="hp-input" data-level="${level}"
                       value="${classData ? classData.hp : ''}"
                       min="1" max="20" placeholder="HP"
                       ${isExisting ? '' : 'disabled'}>
            </td>
            <td class="skill-points" data-level="${level}">${classData ? classData.skillPoints : '-'}</td>
            <td>
                ${isExisting ?
                    `<button class="btn btn-small btn-danger remove-level" data-level="${level}">Remove</button>` :
                    `<button class="btn btn-small btn-primary save-level" data-level="${level}">Save</button>`
                }
            </td>
        `;

        // Populate class dropdown
        const classSelect = row.querySelector('.class-select');
        const classes = dataLoader.getAllClasses();
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = cls.name;
            if (classData && classData.className === cls.name) {
                option.selected = true;
            }
            classSelect.appendChild(option);
        });

        // Populate specialization dropdown
        const specializationSelect = row.querySelector('.specialization-select');
        if (classData && classData.className) {
            const specializations = calculator.getClassSpecializations(classData.className);
            specializations.forEach(spec => {
                const option = document.createElement('option');
                option.value = spec;
                option.textContent = spec;
                if (classData.specialization === spec) {
                    option.selected = true;
                }
                specializationSelect.appendChild(option);
            });

            // Enable specialization dropdown if class is selected
            if (specializations.length > 0) {
                specializationSelect.disabled = false;
            }
        }

        return row;
    }

    attachEventListeners() {
        // Delegate events to container
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('class-select')) {
                this.onClassSelect(e);
            } else if (e.target.classList.contains('specialization-select')) {
                this.onSpecializationSelect(e);
            } else if (e.target.classList.contains('hp-input')) {
                this.onHPChange(e);
            }
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-level')) {
                this.onSaveLevel(e);
            } else if (e.target.classList.contains('remove-level')) {
                this.onRemoveLevel(e);
            } else if (e.target.id === 'addClassLevel') {
                this.onAddLevel();
            }
        });
    }

    onClassSelect(e) {
        const level = parseInt(e.target.dataset.level);
        const className = e.target.value;

        if (!className) return;

        const classData = dataLoader.getClass(className);
        if (!classData) return;

        // Update hit die display
        const hitDieCell = this.container.querySelector(`.hit-die[data-level="${level}"]`);
        if (hitDieCell) {
            hitDieCell.textContent = `d${classData.hitDie}`;
        }

        // Enable HP input
        const hpInput = this.container.querySelector(`.hp-input[data-level="${level}"]`);
        if (hpInput) {
            hpInput.disabled = false;
            hpInput.max = classData.hitDie;

            // Set default HP for level 1
            if (level === 1 && !hpInput.value) {
                hpInput.value = classData.hitDie; // Max HP at level 1
            }
        }

        // NEW: Update specialization dropdown
        const specializationSelect = this.container.querySelector(`.specialization-select[data-level="${level}"]`);
        if (specializationSelect) {
            // Clear existing options except "None"
            specializationSelect.innerHTML = '<option value="">None</option>';

            // Get specializations for this class
            const specializations = calculator.getClassSpecializations(className);
            specializations.forEach(spec => {
                const option = document.createElement('option');
                option.value = spec;
                option.textContent = spec;
                specializationSelect.appendChild(option);
            });

            // Enable or disable based on whether specializations are available
            specializationSelect.disabled = specializations.length === 0;
        }

        // Calculate skill points
        this.updateSkillPoints(level, className);
    }

    // NEW: Handle specialization selection
    onSpecializationSelect(e) {
        const level = parseInt(e.target.dataset.level);
        const specialization = e.target.value || null;

        // Update character data
        character.updateClassSpecialization(level, specialization);
    }

    updateSkillPoints(level, className) {
        const classData = dataLoader.getClass(className);
        if (!classData) return;

        const stats = calculator.calculateAll(character.getData());
        const intMod = stats.abilities.int.modifier;

        const skillPoints = calculator.calculateSkillPoints(classData, intMod);

        // Multiply by 4 for first level
        const totalSkillPoints = level === 1 ? skillPoints * 4 : skillPoints;

        const skillPointsCell = this.container.querySelector(`.skill-points[data-level="${level}"]`);
        if (skillPointsCell) {
            skillPointsCell.textContent = totalSkillPoints;
        }
    }

    onHPChange(e) {
        const level = parseInt(e.target.dataset.level);
        const hp = parseInt(e.target.value);

        // Update immediately if this level is already saved
        const data = character.getData();
        if (data.classes[level - 1]) {
            data.classes[level - 1].hp = hp;
            character.setData(data);
        }
    }

    onSaveLevel(e) {
        const level = parseInt(e.target.dataset.level);

        const classSelect = this.container.querySelector(`.class-select[data-level="${level}"]`);
        const hpInput = this.container.querySelector(`.hp-input[data-level="${level}"]`);

        const className = classSelect.value;
        const hp = parseInt(hpInput.value);

        if (!className) {
            alert('Please select a class');
            return;
        }

        if (!hp || hp < 1) {
            alert('Please enter valid HP');
            return;
        }

        const classData = dataLoader.getClass(className);
        if (!classData) return;

        const stats = calculator.calculateAll(character.getData());
        const intMod = stats.abilities.int.modifier;
        const skillPoints = calculator.calculateSkillPoints(classData, intMod);
        const totalSkillPoints = level === 1 ? skillPoints * 4 : skillPoints;

        character.addClass(level, className, classData, hp, totalSkillPoints);

        // Re-render to show updated state
        this.render();
    }

    onRemoveLevel(e) {
        const level = parseInt(e.target.dataset.level);

        if (confirm(`Remove level ${level}? This will also remove all subsequent levels.`)) {
            const data = character.getData();

            // Remove this level and all higher levels
            data.classes = data.classes.slice(0, level - 1);
            character.setData(data);

            this.render();
        }
    }

    onAddLevel() {
        const data = character.getData();
        const nextLevel = data.level + 1;

        if (nextLevel > this.maxLevels) {
            alert(`Maximum level (${this.maxLevels}) reached`);
            return;
        }

        // Just re-render to show the next empty row
        this.renderClassRows();
    }

    render() {
        this.renderClassRows();
        this.renderClassSummary();
    }

    renderClassSummary() {
        const data = character.getData();
        const summaryDiv = document.getElementById('classSummary');

        if (data.classes.length === 0) {
            summaryDiv.innerHTML = '<p class="info-text">No classes selected yet.</p>';
            return;
        }

        // Count classes
        const classCount = {};
        data.classes.forEach(cls => {
            classCount[cls.className] = (classCount[cls.className] || 0) + 1;
        });

        // Calculate stats
        const stats = calculator.calculateAll(data);

        let summaryHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <label>Total Level:</label>
                    <span>${data.level}</span>
                </div>
                <div class="summary-item">
                    <label>Classes:</label>
                    <span>${Object.entries(classCount).map(([cls, lvl]) => `${cls} ${lvl}`).join(', ')}</span>
                </div>
                <div class="summary-item">
                    <label>Total HP:</label>
                    <span>${stats.hp.total}</span>
                </div>
                <div class="summary-item">
                    <label>Base Attack Bonus:</label>
                    <span>+${stats.bab}</span>
                </div>
                <div class="summary-item">
                    <label>Fortitude Save:</label>
                    <span>${stats.saves.fortitude.base}</span>
                </div>
                <div class="summary-item">
                    <label>Reflex Save:</label>
                    <span>${stats.saves.reflex.base}</span>
                </div>
                <div class="summary-item">
                    <label>Will Save:</label>
                    <span>${stats.saves.will.base}</span>
                </div>
            </div>
        `;

        summaryDiv.innerHTML = summaryHTML;
    }
}

window.ClassesTab = ClassesTab;

// featsTab.js - Feats Tab UI and Logic

class FeatsTab {
    constructor() {
        this.container = document.getElementById('featsTabContent');
        this.searchTerm = '';
        this.flawSearchTerm = '';
        this.typeFilter = 'all';
        this.qualificationFilter = 'all';
        this.selectedFeat = null;
        this.selectedFlaw = null;
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Feat Slots</h2>
                <div id="featSlotsDisplay" class="feat-slots-display"></div>
            </div>

            <div class="card">
                <h2>Current Feats</h2>
                <div class="feats-controls">
                    <button id="addFeatBtn" class="btn btn-primary">Add Feat</button>
                </div>
                <div class="feats-table-container">
                    <table class="feats-table">
                        <thead>
                            <tr>
                                <th>Feat Name</th>
                                <th>Type</th>
                                <th>Level Acquired</th>
                                <th>Prerequisites</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="currentFeatsBody">
                            <!-- Current feats will be added dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h2>Character Flaws</h2>
                <p class="flaw-info-text">In D&D 3.5, characters may take up to 2 flaws. Each flaw grants an additional bonus feat.</p>
                <div class="feats-controls">
                    <button id="addFlawBtn" class="btn btn-primary">Add Flaw</button>
                </div>
                <div class="feats-table-container">
                    <table class="feats-table">
                        <thead>
                            <tr>
                                <th>Flaw Name</th>
                                <th>Source</th>
                                <th>Effect</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="currentFlawsBody">
                            <!-- Current flaws will be added dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Feat Modal -->
            <div id="addFeatModal" class="modal-overlay hidden">
                <div class="modal-content modal-large">
                    <h2>Add Feat</h2>

                    <div class="feat-search-filters">
                        <input type="text" id="featSearch" class="form-control"
                               placeholder="Search feats..." style="width: 300px; display: inline-block;">

                        <select id="featTypeFilter" class="form-control" style="width: 150px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Types</option>
                            <option value="General">General</option>
                            <option value="Combat">Combat</option>
                            <option value="Metamagic">Metamagic</option>
                            <option value="Item Creation">Item Creation</option>
                            <option value="Divine">Divine</option>
                        </select>

                        <select id="featQualificationFilter" class="form-control" style="width: 180px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Feats</option>
                            <option value="available">Available Only</option>
                        </select>
                    </div>

                    <div class="modal-database-content">
                        <div class="feat-list-container">
                            <div id="featList" class="feat-list">
                                <!-- Feat items will be added dynamically -->
                            </div>
                        </div>

                        <div id="featDetails" class="feat-details hidden">
                            <h3 id="featDetailName"></h3>
                            <p><strong>Type:</strong> <span id="featDetailType"></span></p>
                            <p><strong>Prerequisites:</strong> <span id="featDetailPrereq"></span></p>
                            <div id="featPrereqStatus"></div>

                            <!-- NEW: Feat Choice Selector -->
                            <div id="featChoiceSelector" class="feat-choice-selector hidden">
                                <p><strong id="featChoiceLabel">Choose Option:</strong></p>
                                <select id="featChoiceSelect" class="form-control" style="width: 100%; max-width: 400px;">
                                    <option value="">-- Select --</option>
                                </select>
                            </div>

                            <p><strong>Benefit:</strong></p>
                            <div id="featDetailBenefit"></div>
                            <div id="featDetailNormal"></div>
                            <div id="featDetailSpecial"></div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="confirmAddFeat" class="btn btn-primary" disabled>Add Feat</button>
                        <button id="cancelAddFeat" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Add Flaw Modal -->
            <div id="addFlawModal" class="modal-overlay hidden">
                <div class="modal-content modal-large">
                    <h2>Add Flaw</h2>

                    <div class="feat-search-filters">
                        <input type="text" id="flawSearch" class="form-control"
                               placeholder="Search flaws..." style="width: 300px; display: inline-block;">
                    </div>

                    <div class="modal-database-content">
                        <div class="feat-list-container">
                            <div id="flawList" class="feat-list">
                                <!-- Flaw items will be added dynamically -->
                            </div>
                        </div>

                        <div id="flawDetails" class="feat-details hidden">
                            <h3 id="flawDetailName"></h3>
                            <p><strong>Source:</strong> <span id="flawDetailSource"></span></p>
                            <p><strong>Description:</strong></p>
                            <div id="flawDetailDescription"></div>
                            <p><strong>Effect:</strong></p>
                            <div id="flawDetailEffect"></div>
                            <div id="flawDetailPrereq"></div>
                            <div id="flawDetailSpecial"></div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="confirmAddFlaw" class="btn btn-primary" disabled>Add Flaw</button>
                        <button id="cancelAddFlaw" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Feat Details Modal (for viewing) -->
            <div id="viewFeatModal" class="modal-overlay hidden">
                <div class="modal-content">
                    <h3 id="viewFeatName"></h3>
                    <p><strong>Type:</strong> <span id="viewFeatType"></span></p>
                    <p><strong>Prerequisites:</strong> <span id="viewFeatPrereq"></span></p>
                    <p><strong>Benefit:</strong></p>
                    <div id="viewFeatBenefit"></div>
                    <div id="viewFeatNormal"></div>
                    <div id="viewFeatSpecial"></div>
                    <div class="modal-footer">
                        <button id="closeViewFeat" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>

            <!-- Flaw Details Modal (for viewing) -->
            <div id="viewFlawModal" class="modal-overlay hidden">
                <div class="modal-content">
                    <h3 id="viewFlawName"></h3>
                    <p><strong>Source:</strong> <span id="viewFlawSource"></span></p>
                    <p><strong>Description:</strong></p>
                    <div id="viewFlawDescription"></div>
                    <p><strong>Effect:</strong></p>
                    <div id="viewFlawEffect"></div>
                    <div id="viewFlawPrereq"></div>
                    <div id="viewFlawSpecial"></div>
                    <div class="modal-footer">
                        <button id="closeViewFlaw" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add feat button
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'addFeatBtn') {
                this.openAddFeatModal();
            } else if (e.target.id === 'addFlawBtn') {
                this.openAddFlawModal();
            } else if (e.target.classList.contains('view-feat-btn')) {
                const featName = e.target.dataset.feat;
                this.viewFeatDetails(featName);
            } else if (e.target.classList.contains('view-flaw-btn')) {
                const flawName = e.target.dataset.flaw;
                this.viewFlawDetails(flawName);
            } else if (e.target.classList.contains('remove-feat-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.removeFeat(index);
            } else if (e.target.classList.contains('remove-flaw-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.removeFlaw(index);
            }
        });

        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmAddFeat') {
                this.addSelectedFeat();
            } else if (e.target.id === 'confirmAddFlaw') {
                this.addSelectedFlaw();
            } else if (e.target.id === 'cancelAddFeat') {
                this.closeAddFeatModal();
            } else if (e.target.id === 'cancelAddFlaw') {
                this.closeAddFlawModal();
            } else if (e.target.id === 'closeViewFeat') {
                this.closeViewFeatModal();
            } else if (e.target.id === 'closeViewFlaw') {
                this.closeViewFlawModal();
            } else if (e.target.closest('.feat-item')) {
                const featItem = e.target.closest('.feat-item');
                if (featItem.dataset.feat) {
                    this.selectFeat(featItem.dataset.feat);
                } else if (featItem.dataset.flaw) {
                    this.selectFlaw(featItem.dataset.flaw);
                }
            }
        });

        // Search and filters
        document.addEventListener('input', (e) => {
            if (e.target.id === 'featSearch') {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderFeatList();
            } else if (e.target.id === 'flawSearch') {
                this.flawSearchTerm = e.target.value.toLowerCase();
                this.renderFlawList();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'featTypeFilter') {
                this.typeFilter = e.target.value;
                this.renderFeatList();
            } else if (e.target.id === 'featQualificationFilter') {
                this.qualificationFilter = e.target.value;
                this.renderFeatList();
            }
        });
    }

    render(stats) {
        if (!stats) return;
        this.stats = stats;
        this.renderFeatSlots();
        this.renderCurrentFeats();
        this.renderCurrentFlaws();
    }

    renderFeatSlots() {
        const display = document.getElementById('featSlotsDisplay');
        if (!display) return;

        const data = character.getData();
        const slots = calculator.calculateFeatSlots(data);

        let statusClass = 'available';
        if (slots.available === 0) {
            statusClass = 'full';
        } else if (slots.available < 0) {
            statusClass = 'overspent';
        }

        let breakdownHTML = '<ul class="feat-slots-breakdown">';
        slots.breakdown.forEach(item => {
            breakdownHTML += `<li>${item.source}: ${item.slots}</li>`;
        });
        breakdownHTML += '</ul>';

        display.innerHTML = `
            <div class="feat-slots-summary ${statusClass}">
                <div class="feat-slots-main">
                    <strong>Total Slots:</strong> ${slots.total} |
                    <strong>Used:</strong> ${slots.used} |
                    <strong>Available:</strong> ${slots.available}
                </div>
                ${breakdownHTML}
            </div>
        `;
    }

    renderCurrentFeats() {
        const tbody = document.getElementById('currentFeatsBody');
        if (!tbody) return;

        const data = character.getData();
        const feats = data.feats || [];

        tbody.innerHTML = '';

        if (feats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No feats selected. Click "Add Feat" to choose feats for your character.</td></tr>';
            return;
        }

        feats.forEach((feat, index) => {
            const row = document.createElement('tr');

            // Get feat details from database if available
            const featData = dataLoader.gameData.feats.get(feat.name);
            const prereq = featData ? (featData.prerequisite || 'None') : (feat.prerequisite || 'None');

            // Format feat name with choice if available
            const displayName = feat.choice ? `${feat.name} (${feat.choice})` : feat.name;

            // Get feat category
            let categoryBadge = '';
            if (featData) {
                const parsed = parseFeatBenefits(featData, feat.choice);
                const categoryClass = this.getCategoryClass(parsed.category);
                const categoryIcon = this.getCategoryIcon(parsed.category);
                categoryBadge = `<span class="feat-category-badge ${categoryClass}" title="${parsed.description}">${categoryIcon} ${parsed.category}</span>`;
            }

            row.innerHTML = `
                <td>
                    <strong>${displayName}</strong>
                    ${categoryBadge}
                </td>
                <td>${feat.type || 'General'}</td>
                <td>${feat.level || 1}</td>
                <td class="feat-prereq-cell">${prereq}</td>
                <td>
                    <button class="btn btn-small view-feat-btn" data-feat="${feat.name}">View</button>
                    <button class="btn btn-small btn-danger remove-feat-btn" data-index="${index}">Remove</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    openAddFeatModal() {
        const modal = document.getElementById('addFeatModal');
        modal.classList.remove('hidden');

        // Reset filters
        this.searchTerm = '';
        this.typeFilter = 'all';
        this.qualificationFilter = 'all';
        document.getElementById('featSearch').value = '';
        document.getElementById('featTypeFilter').value = 'all';
        document.getElementById('featQualificationFilter').value = 'all';

        this.renderFeatList();
    }

    closeAddFeatModal() {
        document.getElementById('addFeatModal').classList.remove('hidden');
        document.getElementById('addFeatModal').classList.add('hidden');
        this.selectedFeat = null;
        document.getElementById('featDetails').classList.add('hidden');
        document.getElementById('confirmAddFeat').disabled = true;
    }

    renderFeatList() {
        const featList = document.getElementById('featList');
        if (!featList) return;

        const data = character.getData();
        const stats = this.stats || calculator.calculateAll(data);
        const feats = Array.from(dataLoader.gameData.feats.values());

        // Filter feats
        const filteredFeats = feats.filter(feat => {
            // Search filter
            if (this.searchTerm && !feat.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }

            // Type filter
            if (this.typeFilter !== 'all' && feat.type !== this.typeFilter) {
                return false;
            }

            // Qualification filter
            if (this.qualificationFilter === 'available') {
                const prereqCheck = calculator.checkFeatPrerequisites(data, feat, stats.abilities);
                if (!prereqCheck.qualifies) {
                    return false;
                }
            }

            return true;
        });

        // Sort by name
        filteredFeats.sort((a, b) => a.name.localeCompare(b.name));

        featList.innerHTML = '';

        if (filteredFeats.length === 0) {
            featList.innerHTML = '<p style="text-align: center; padding: 20px;">No feats found matching filters.</p>';
            return;
        }

        filteredFeats.forEach(feat => {
            const prereqCheck = calculator.checkFeatPrerequisites(data, feat, stats.abilities);
            const qualifies = prereqCheck.qualifies;

            // Get feat category
            const parsed = parseFeatBenefits(feat);
            const categoryClass = this.getCategoryClass(parsed.category);
            const categoryIcon = this.getCategoryIcon(parsed.category);

            const item = document.createElement('div');
            item.className = `feat-item ${qualifies ? 'feat-available' : 'feat-unavailable'}`;
            item.dataset.feat = feat.name;

            const statusIcon = qualifies ? '✓' : '✗';
            const statusClass = qualifies ? 'status-available' : 'status-unavailable';

            item.innerHTML = `
                <div class="feat-item-header">
                    <span class="feat-status ${statusClass}">${statusIcon}</span>
                    <strong>${feat.name}</strong>
                    <div style="display: inline-flex; gap: 5px; align-items: center;">
                        <span class="feat-type-badge">${feat.type}</span>
                        <span class="feat-category-badge ${categoryClass}" title="${parsed.description}">${categoryIcon}</span>
                    </div>
                </div>
                ${!qualifies ? `<div class="feat-missing-prereqs">Missing: ${prereqCheck.missing.join(', ')}</div>` : ''}
            `;

            featList.appendChild(item);
        });
    }

    selectFeat(featName) {
        this.selectedFeat = featName;
        this.selectedFeatChoice = null; // Reset choice
        const featData = dataLoader.gameData.feats.get(featName);
        if (!featData) return;

        const data = character.getData();
        const stats = this.stats || calculator.calculateAll(data);
        const prereqCheck = calculator.checkFeatPrerequisites(data, featData, stats.abilities);

        // Update feat details panel
        const detailsPanel = document.getElementById('featDetails');
        detailsPanel.classList.remove('hidden');

        document.getElementById('featDetailName').textContent = featData.name;
        document.getElementById('featDetailType').textContent = featData.type;
        document.getElementById('featDetailPrereq').textContent = featData.prerequisite || 'None';

        // Show source if available
        if (featData.source) {
            const sourceEl = document.getElementById('featDetailType');
            sourceEl.textContent = `${featData.type} (${featData.source})`;
        }

        // NEW: Show feat category
        const parsed = parseFeatBenefits(featData, this.selectedFeatChoice);
        const categoryClass = this.getCategoryClass(parsed.category);
        const categoryIcon = this.getCategoryIcon(parsed.category);
        const categoryHTML = `
            <div class="feat-category-info" style="margin: 15px 0; padding: 12px; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <strong style="display: flex; align-items: center; gap: 8px;">
                    <span class="feat-category-badge ${categoryClass}" style="margin: 0;">${categoryIcon} ${parsed.category}</span>
                </strong>
                <p style="margin: 8px 0 0 0; font-size: 0.9em; color: #666;">${parsed.description}</p>
            </div>
        `;

        // Insert category info after type
        const typeEl = document.getElementById('featDetailType');
        if (!document.querySelector('.feat-category-info')) {
            typeEl.parentElement.insertAdjacentHTML('afterend', categoryHTML);
        } else {
            document.querySelector('.feat-category-info').outerHTML = categoryHTML;
        }

        // Show prerequisite status
        const prereqStatus = document.getElementById('featPrereqStatus');
        if (!prereqCheck.qualifies) {
            prereqStatus.innerHTML = `<div class="alert alert-warning"><strong>Missing Prerequisites:</strong> ${prereqCheck.missing.join(', ')}</div>`;
        } else {
            prereqStatus.innerHTML = '<div class="alert alert-success">All prerequisites met!</div>';
        }

        // NEW: Show choice selector if feat requires choice
        const choiceInfo = getFeatChoiceInfo(featName);
        const choiceSelector = document.getElementById('featChoiceSelector');
        const choiceSelect = document.getElementById('featChoiceSelect');
        const choiceLabel = document.getElementById('featChoiceLabel');

        if (choiceInfo) {
            // Show choice selector
            choiceSelector.classList.remove('hidden');
            choiceLabel.textContent = choiceInfo.label + ':';

            // Check if this is a multi-select feat
            if (choiceInfo.multiSelect) {
                // Multi-select: show checkboxes
                const options = choiceInfo.getOptions();
                const maxSelections = choiceInfo.maxSelections || options.length;

                // Replace dropdown with checkbox list
                let checkboxHTML = `<div class="feat-multi-select" style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-top: 5px;">`;
                options.forEach((option, index) => {
                    checkboxHTML += `
                        <div class="checkbox" style="margin: 5px 0;">
                            <label>
                                <input type="checkbox" name="featChoice" value="${option}" data-index="${index}">
                                ${option}
                            </label>
                        </div>
                    `;
                });
                checkboxHTML += `</div>`;
                checkboxHTML += `<p class="text-muted" style="margin-top: 5px;">Select exactly ${maxSelections} skill(s)</p>`;

                choiceSelect.style.display = 'none';
                choiceSelect.insertAdjacentHTML('afterend', checkboxHTML);

                // Handle checkbox changes
                const checkboxes = choiceSelector.querySelectorAll('input[name="featChoice"]');
                this.selectedFeatChoices = []; // Array for multi-select

                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        this.selectedFeatChoices = Array.from(checkboxes)
                            .filter(cb => cb.checked)
                            .map(cb => cb.value);

                        // Limit selections
                        if (this.selectedFeatChoices.length >= maxSelections) {
                            checkboxes.forEach(cb => {
                                if (!cb.checked) cb.disabled = true;
                            });
                        } else {
                            checkboxes.forEach(cb => cb.disabled = false);
                        }

                        // Enable add button only if correct number of selections made
                        const addButton = document.getElementById('confirmAddFeat');
                        addButton.disabled = !prereqCheck.qualifies ||
                            this.selectedFeatChoices.length !== maxSelections;
                    });
                });

                // Initially disable add button
                const addButton = document.getElementById('confirmAddFeat');
                addButton.disabled = true;

            } else {
                // Single select: show dropdown
                const options = choiceInfo.getOptions();
                choiceSelect.style.display = 'block';

                // Remove any multi-select elements
                const multiSelectDiv = choiceSelector.querySelector('.feat-multi-select');
                if (multiSelectDiv) {
                    multiSelectDiv.parentElement.remove();
                }

                choiceSelect.innerHTML = '<option value="">-- Select --</option>';
                options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option;
                    optionEl.textContent = option;
                    choiceSelect.appendChild(optionEl);
                });

                // Handle choice selection
                choiceSelect.onchange = () => {
                    this.selectedFeatChoice = choiceSelect.value;
                    this.selectedFeatChoices = null; // Clear multi-select
                    const addButton = document.getElementById('confirmAddFeat');
                    addButton.disabled = !prereqCheck.qualifies || !this.selectedFeatChoice;
                };

                // Initially disable add button until choice is made
                const addButton = document.getElementById('confirmAddFeat');
                addButton.disabled = !prereqCheck.qualifies;
            }

            // Show note if available
            if (choiceInfo.note) {
                const noteEl = document.createElement('p');
                noteEl.className = 'text-info';
                noteEl.style.marginTop = '10px';
                noteEl.textContent = '📝 ' + choiceInfo.note;
                choiceSelector.appendChild(noteEl);
            }
        } else {
            // Hide choice selector
            choiceSelector.classList.add('hidden');
            this.selectedFeatChoice = null;
            this.selectedFeatChoices = null;

            // Clean up any multi-select elements
            const multiSelectDiv = document.querySelector('.feat-multi-select');
            if (multiSelectDiv) {
                multiSelectDiv.parentElement.remove();
            }

            // Enable/disable add button based on prerequisites only
            const addButton = document.getElementById('confirmAddFeat');
            addButton.disabled = !prereqCheck.qualifies;
        }

        // Clean up HTML in benefit text
        const benefit = featData.benefit.replace(/<[^>]*>/g, '').trim();
        document.getElementById('featDetailBenefit').textContent = benefit || 'No benefit description available.';

        // NEW: Show mechanical effects summary
        let mechanicalEl = document.getElementById('featDetailMechanical');
        if (!mechanicalEl) {
            // Create mechanical effects element if it doesn't exist
            mechanicalEl = document.createElement('div');
            mechanicalEl.id = 'featDetailMechanical';
            mechanicalEl.className = 'feat-mechanical-effects';
            document.getElementById('featDetailBenefit').parentNode.insertBefore(
                mechanicalEl,
                document.getElementById('featDetailNormal')
            );
        }

        // Get mechanical summary (using choice if available for preview)
        const previewChoice = this.selectedFeatChoice || null;
        const mechanicalSummary = getFeatMechanicalSummary(featData, previewChoice);

        if (mechanicalSummary && mechanicalSummary !== 'No automatic bonuses') {
            mechanicalEl.innerHTML = `<p style="margin-top: 15px;"><strong style="color: #28a745;">⚡ Automatic Effects:</strong> ${mechanicalSummary}</p>`;
            mechanicalEl.style.display = 'block';
        } else {
            // Check if feat has special effects that require UI
            const parsed = parseFeatBenefits(featData);
            if (parsed.special.length > 0 && parsed.special.some(s => s.requires_ui)) {
                mechanicalEl.innerHTML = `<p style="margin-top: 15px;"><strong style="color: #ffc107;">⚠️ Manual Effect:</strong> This feat requires manual tracking or UI implementation</p>`;
                mechanicalEl.style.display = 'block';
            } else {
                mechanicalEl.style.display = 'none';
            }
        }

        // Update mechanical summary when choice changes
        if (choiceInfo) {
            const originalOnChange = choiceSelect.onchange;
            choiceSelect.onchange = () => {
                // Call original handler
                if (originalOnChange) originalOnChange.call(this);

                // Update mechanical summary with new choice
                const newChoice = choiceSelect.value;
                if (newChoice) {
                    const newSummary = getFeatMechanicalSummary(featData, newChoice);
                    if (newSummary && newSummary !== 'No automatic bonuses') {
                        mechanicalEl.innerHTML = `<p style="margin-top: 15px;"><strong style="color: #28a745;">⚡ Automatic Effects:</strong> ${newSummary}</p>`;
                        mechanicalEl.style.display = 'block';
                    }
                }
            };
        }

        if (featData.normal) {
            const normal = featData.normal.replace(/<[^>]*>/g, '').trim();
            document.getElementById('featDetailNormal').innerHTML = `<p><strong>Normal:</strong> ${normal}</p>`;
        } else {
            document.getElementById('featDetailNormal').innerHTML = '';
        }

        if (featData.special) {
            const special = featData.special.replace(/<[^>]*>/g, '').trim();
            document.getElementById('featDetailSpecial').innerHTML = `<p><strong>Special:</strong> ${special}</p>`;
        } else {
            document.getElementById('featDetailSpecial').innerHTML = '';
        }

        // Highlight selected feat in list
        document.querySelectorAll('.feat-item').forEach(item => {
            if (item.dataset.feat === featName) {
                item.classList.add('feat-item-selected');
            } else {
                item.classList.remove('feat-item-selected');
            }
        });
    }

    addSelectedFeat() {
        if (!this.selectedFeat) return;

        const featData = dataLoader.gameData.feats.get(this.selectedFeat);
        if (!featData) return;

        const data = character.getData();

        // Check if feat requires a choice and if one was made
        const choiceInfo = getFeatChoiceInfo(this.selectedFeat);
        if (choiceInfo) {
            if (choiceInfo.multiSelect) {
                // Multi-select feat
                if (!this.selectedFeatChoices || this.selectedFeatChoices.length !== (choiceInfo.maxSelections || 1)) {
                    alert(`Please select exactly ${choiceInfo.maxSelections || 1} option(s) for this feat.`);
                    return;
                }
            } else {
                // Single select feat
                if (!this.selectedFeatChoice) {
                    alert('Please select an option for this feat.');
                    return;
                }
            }
        }

        // Check if already has this feat
        const alreadyHas = data.feats.some(f => f.name === this.selectedFeat);
        if (alreadyHas && !featData.multiple) {
            alert('You already have this feat and it cannot be taken multiple times.');
            return;
        }

        // Build feat object
        const feat = {
            name: featData.name,
            type: featData.type,
            level: data.level,
            source: 'core'
        };

        // Add choice if applicable
        if (choiceInfo && choiceInfo.multiSelect && this.selectedFeatChoices) {
            // Multi-select: store array of choices
            feat.choices = this.selectedFeatChoices;
            feat.choice = this.selectedFeatChoices.join(', '); // For display
            feat.details = this.selectedFeatChoices.join(', ');
        } else if (this.selectedFeatChoice) {
            // Single select
            feat.choice = this.selectedFeatChoice;
            feat.details = this.selectedFeatChoice;
        }

        // Special handling for Skill Knowledge - add skills to characterClassSkills
        if (this.selectedFeat === 'Skill Knowledge' && this.selectedFeatChoices) {
            if (!data.characterClassSkills) {
                data.characterClassSkills = [];
            }
            this.selectedFeatChoices.forEach(skill => {
                if (!data.characterClassSkills.includes(skill)) {
                    data.characterClassSkills.push(skill);
                }
            });
            character.updateData(data);
        }

        // Add feat to character
        character.addFeat(feat);

        this.closeAddFeatModal();
        this.render(this.stats);
    }

    removeFeat(index) {
        if (confirm('Remove this feat?')) {
            const data = character.getData();
            const feat = data.feats[index];

            // Special handling for Skill Knowledge - remove skills from characterClassSkills
            if (feat && feat.name === 'Skill Knowledge' && feat.choices) {
                if (data.characterClassSkills) {
                    feat.choices.forEach(skill => {
                        const skillIndex = data.characterClassSkills.indexOf(skill);
                        if (skillIndex !== -1) {
                            data.characterClassSkills.splice(skillIndex, 1);
                        }
                    });
                    character.updateData(data);
                }
            }

            character.removeFeat(index);
            this.render(this.stats);
        }
    }

    viewFeatDetails(featName) {
        // Check current feats first
        const data = character.getData();
        const currentFeat = data.feats.find(f => f.name === featName);

        // Then check database
        const featData = dataLoader.gameData.feats.get(featName);
        if (!featData && !currentFeat) return;

        const modal = document.getElementById('viewFeatModal');
        modal.classList.remove('hidden');

        const feat = featData || currentFeat;

        document.getElementById('viewFeatName').textContent = feat.name;
        document.getElementById('viewFeatType').textContent = feat.type || 'General';

        // Add source to type display if available
        if (featData && featData.source) {
            document.getElementById('viewFeatType').textContent = `${feat.type || 'General'} (${featData.source})`;
        }

        document.getElementById('viewFeatPrereq').textContent = feat.prerequisite || 'None';

        if (featData) {
            const benefit = featData.benefit.replace(/<[^>]*>/g, '').trim();
            document.getElementById('viewFeatBenefit').textContent = benefit || 'No description available.';

            if (featData.normal) {
                const normal = featData.normal.replace(/<[^>]*>/g, '').trim();
                document.getElementById('viewFeatNormal').innerHTML = `<p><strong>Normal:</strong> ${normal}</p>`;
            } else {
                document.getElementById('viewFeatNormal').innerHTML = '';
            }

            if (featData.special) {
                const special = featData.special.replace(/<[^>]*>/g, '').trim();
                document.getElementById('viewFeatSpecial').innerHTML = `<p><strong>Special:</strong> ${special}</p>`;
            } else {
                document.getElementById('viewFeatSpecial').innerHTML = '';
            }
        } else {
            document.getElementById('viewFeatBenefit').textContent = 'No description available.';
            document.getElementById('viewFeatNormal').innerHTML = '';
            document.getElementById('viewFeatSpecial').innerHTML = '';
        }
    }

    closeViewFeatModal() {
        document.getElementById('viewFeatModal').classList.remove('hidden');
        document.getElementById('viewFeatModal').classList.add('hidden');
    }

    // ========== FLAW METHODS ==========

    renderCurrentFlaws() {
        const tbody = document.getElementById('currentFlawsBody');
        if (!tbody) return;

        const data = character.getData();
        const flaws = data.flaws || [];

        tbody.innerHTML = '';

        if (flaws.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No flaws selected. Characters may take up to 2 flaws for additional feat slots.</td></tr>';
            return;
        }

        flaws.forEach((flaw, index) => {
            const row = document.createElement('tr');

            // Get flaw details from database if available
            const flawData = dataLoader.gameData.flaws.get(flaw.name);
            const source = flawData ? (flawData.source || 'Unknown') : (flaw.source || 'Unknown');
            const effect = flawData ? (flawData.effect || '') : (flaw.effect || '');

            row.innerHTML = `
                <td><strong>${flaw.name}</strong></td>
                <td>${source}</td>
                <td class="flaw-effect-cell">${effect}</td>
                <td>
                    <button class="btn btn-small view-flaw-btn" data-flaw="${flaw.name}">View</button>
                    <button class="btn btn-small btn-danger remove-flaw-btn" data-index="${index}">Remove</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    openAddFlawModal() {
        const data = character.getData();
        const flaws = data.flaws || [];

        if (flaws.length >= 2) {
            alert('You already have the maximum number of flaws (2). Remove a flaw before adding a new one.');
            return;
        }

        const modal = document.getElementById('addFlawModal');
        modal.classList.remove('hidden');

        // Reset search
        this.flawSearchTerm = '';
        document.getElementById('flawSearch').value = '';

        this.renderFlawList();
    }

    closeAddFlawModal() {
        document.getElementById('addFlawModal').classList.remove('hidden');
        document.getElementById('addFlawModal').classList.add('hidden');
        this.selectedFlaw = null;
        document.getElementById('flawDetails').classList.add('hidden');
        document.getElementById('confirmAddFlaw').disabled = true;
    }

    renderFlawList() {
        const flawList = document.getElementById('flawList');
        if (!flawList) return;

        const data = character.getData();
        const flaws = Array.from(dataLoader.gameData.flaws.values());

        // Filter flaws
        const filteredFlaws = flaws.filter(flaw => {
            // Search filter
            if (this.flawSearchTerm && !flaw.name.toLowerCase().includes(this.flawSearchTerm)) {
                return false;
            }

            return true;
        });

        // Sort by name
        filteredFlaws.sort((a, b) => a.name.localeCompare(b.name));

        flawList.innerHTML = '';

        if (filteredFlaws.length === 0) {
            flawList.innerHTML = '<p style="text-align: center; padding: 20px;">No flaws found matching search.</p>';
            return;
        }

        filteredFlaws.forEach(flaw => {
            const item = document.createElement('div');
            item.className = 'feat-item feat-available';
            item.dataset.flaw = flaw.name;

            item.innerHTML = `
                <div class="feat-item-header">
                    <strong>${flaw.name}</strong>
                    <span class="feat-type-badge" style="background: #d9534f;">${flaw.type}</span>
                </div>
                <div class="feat-description-preview">${flaw.description ? flaw.description.substring(0, 100) + '...' : ''}</div>
            `;

            flawList.appendChild(item);
        });
    }

    selectFlaw(flawName) {
        this.selectedFlaw = flawName;
        const flawData = dataLoader.gameData.flaws.get(flawName);
        if (!flawData) return;

        // Update flaw details panel
        const detailsPanel = document.getElementById('flawDetails');
        detailsPanel.classList.remove('hidden');

        document.getElementById('flawDetailName').textContent = flawData.name;
        document.getElementById('flawDetailSource').textContent = flawData.source || 'Unknown';
        document.getElementById('flawDetailDescription').textContent = flawData.description || 'No description available.';
        document.getElementById('flawDetailEffect').textContent = flawData.effect || 'No effect description available.';

        if (flawData.prerequisite) {
            document.getElementById('flawDetailPrereq').innerHTML = `<p><strong>Prerequisites:</strong> ${flawData.prerequisite}</p>`;
        } else {
            document.getElementById('flawDetailPrereq').innerHTML = '';
        }

        if (flawData.special) {
            document.getElementById('flawDetailSpecial').innerHTML = `<p><strong>Special:</strong> ${flawData.special}</p>`;
        } else {
            document.getElementById('flawDetailSpecial').innerHTML = '';
        }

        // Enable add button
        const addButton = document.getElementById('confirmAddFlaw');
        addButton.disabled = false;

        // Highlight selected flaw in list
        document.querySelectorAll('.feat-item').forEach(item => {
            if (item.dataset.flaw === flawName) {
                item.classList.add('feat-item-selected');
            } else {
                item.classList.remove('feat-item-selected');
            }
        });
    }

    addSelectedFlaw() {
        if (!this.selectedFlaw) return;

        const flawData = dataLoader.gameData.flaws.get(this.selectedFlaw);
        if (!flawData) return;

        const data = character.getData();

        // Check if already has this flaw
        const alreadyHas = data.flaws.some(f => f.name === this.selectedFlaw);
        if (alreadyHas) {
            alert('You already have this flaw.');
            return;
        }

        // Add flaw to character
        character.addFlaw({
            name: flawData.name,
            source: flawData.source,
            effect: flawData.effect,
            description: flawData.description
        });

        this.closeAddFlawModal();
        this.render(this.stats);
    }

    removeFlaw(index) {
        if (confirm('Remove this flaw?')) {
            character.removeFlaw(index);
            this.render(this.stats);
        }
    }

    viewFlawDetails(flawName) {
        // Check current flaws first
        const data = character.getData();
        const currentFlaw = data.flaws.find(f => f.name === flawName);

        // Then check database
        const flawData = dataLoader.gameData.flaws.get(flawName);
        if (!flawData && !currentFlaw) return;

        const modal = document.getElementById('viewFlawModal');
        modal.classList.remove('hidden');

        const flaw = flawData || currentFlaw;

        document.getElementById('viewFlawName').textContent = flaw.name;
        document.getElementById('viewFlawSource').textContent = flaw.source || 'Unknown';
        document.getElementById('viewFlawDescription').textContent = flaw.description || 'No description available.';
        document.getElementById('viewFlawEffect').textContent = flaw.effect || 'No effect description available.';

        if (flaw.prerequisite) {
            document.getElementById('viewFlawPrereq').innerHTML = `<p><strong>Prerequisites:</strong> ${flaw.prerequisite}</p>`;
        } else {
            document.getElementById('viewFlawPrereq').innerHTML = '';
        }

        if (flaw.special) {
            document.getElementById('viewFlawSpecial').innerHTML = `<p><strong>Special:</strong> ${flaw.special}</p>`;
        } else {
            document.getElementById('viewFlawSpecial').innerHTML = '';
        }
    }

    closeViewFlawModal() {
        document.getElementById('viewFlawModal').classList.remove('hidden');
        document.getElementById('viewFlawModal').classList.add('hidden');
    }

    // Helper: Get CSS class for feat category
    getCategoryClass(category) {
        const categoryClasses = {
            'automatic': 'category-automatic',
            'manual': 'category-manual',
            'informational': 'category-informational',
            'metamagic': 'category-metamagic',
            'special_ui': 'category-special'
        };
        return categoryClasses[category] || 'category-unknown';
    }

    // Helper: Get icon for feat category
    getCategoryIcon(category) {
        const categoryIcons = {
            'automatic': '⚡',
            'manual': '📋',
            'informational': 'ℹ️',
            'metamagic': '✨',
            'special_ui': '🔧'
        };
        return categoryIcons[category] || '?';
    }
}

window.FeatsTab = FeatsTab;

// inventoryTab.js - Inventory Tab UI

class InventoryTab {
    constructor() {
        this.container = document.getElementById('inventoryTabContent');
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Wealth & Experience</h2>
                <div class="wealth-grid">
                    <div class="wealth-input-group">
                        <label>Platinum (PP)</label>
                        <input type="number" id="wealthPlatinum" class="form-control wealth-input" data-coin="platinum" min="0" value="0">
                    </div>
                    <div class="wealth-input-group">
                        <label>Gold (GP)</label>
                        <input type="number" id="wealthGold" class="form-control wealth-input" data-coin="gold" min="0" value="0">
                    </div>
                    <div class="wealth-input-group">
                        <label>Silver (SP)</label>
                        <input type="number" id="wealthSilver" class="form-control wealth-input" data-coin="silver" min="0" value="0">
                    </div>
                    <div class="wealth-input-group">
                        <label>Copper (CP)</label>
                        <input type="number" id="wealthCopper" class="form-control wealth-input" data-coin="copper" min="0" value="0">
                    </div>
                </div>
                <div id="wealthTotal" class="wealth-total"></div>

                <div class="xp-section">
                    <div class="xp-input-group">
                        <label>Experience Points</label>
                        <input type="number" id="experienceInput" class="form-control" min="0" value="0">
                    </div>
                    <div id="xpProgress" class="xp-progress"></div>
                </div>
            </div>

            <div class="card">
                <h2>Carrying Capacity</h2>
                <div id="carryingCapacityDisplay" class="carrying-capacity-display"></div>
            </div>

            <div class="card">
                <h2>Magic Item Slots</h2>
                <div class="magic-items-grid">
                    <div class="magic-item-slot">
                        <label>Head</label>
                        <input type="text" class="form-control magic-item-input" data-slot="head" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Face</label>
                        <input type="text" class="form-control magic-item-input" data-slot="face" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Neck</label>
                        <input type="text" class="form-control magic-item-input" data-slot="neck" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Shoulder</label>
                        <input type="text" class="form-control magic-item-input" data-slot="shoulder" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Body</label>
                        <input type="text" class="form-control magic-item-input" data-slot="body" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Torso</label>
                        <input type="text" class="form-control magic-item-input" data-slot="torso" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Arms</label>
                        <input type="text" class="form-control magic-item-input" data-slot="arm" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Hands</label>
                        <input type="text" class="form-control magic-item-input" data-slot="hand" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Left Ring</label>
                        <input type="text" class="form-control magic-item-input" data-slot="leftRing" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Right Ring</label>
                        <input type="text" class="form-control magic-item-input" data-slot="rightRing" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Waist</label>
                        <input type="text" class="form-control magic-item-input" data-slot="waist" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Feet</label>
                        <input type="text" class="form-control magic-item-input" data-slot="feet" placeholder="Empty">
                    </div>
                    <div class="magic-item-slot">
                        <label>Armor</label>
                        <input type="text" class="form-control magic-item-input" data-slot="armor" placeholder="Empty">
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Carried Items</h2>
                <div class="carried-items-controls">
                    <button id="addFromDatabaseBtn" class="btn btn-primary btn-small">Add from Database</button>
                    <button id="addCustomItemBtn" class="btn btn-secondary btn-small">Add Custom Item</button>
                </div>

                <div class="carried-items-table-container">
                    <table class="carried-items-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Weight (lbs)</th>
                                <th>Quantity</th>
                                <th>Cost (GP)</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="carriedItemsBody">
                            <!-- Items will be added dynamically -->
                        </tbody>
                        <tfoot>
                            <tr class="total-weight-row">
                                <td colspan="5"><strong>Total Weight:</strong></td>
                                <td id="totalWeightDisplay"><strong>0 lbs</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Add from Database Modal -->
            <div id="addItemDatabaseModal" class="modal-overlay hidden">
                <div class="modal-content modal-large">
                    <h2>Add Item from Database</h2>

                    <div class="item-search-filters">
                        <input type="text" id="itemSearch" class="form-control"
                               placeholder="Search items..." style="width: 300px; display: inline-block;">

                        <select id="itemTypeFilter" class="form-control" style="width: 150px; display: inline-block; margin-left: 10px;">
                            <option value="all">All Items</option>
                            <option value="equipment">Equipment</option>
                            <option value="magic">Magic Items</option>
                            <option value="weapons">Weapons</option>
                        </select>
                    </div>

                    <div class="modal-database-content">
                        <div class="item-list-container">
                            <div id="itemDatabaseList" class="item-list">
                                <!-- Item entries will be added dynamically -->
                            </div>
                        </div>

                        <div id="itemDatabaseDetails" class="item-details hidden">
                            <h3 id="itemDetailName"></h3>
                            <p><strong>Type:</strong> <span id="itemDetailType"></span></p>
                            <p><strong>Category:</strong> <span id="itemDetailCategory"></span></p>
                            <p><strong>Cost:</strong> <span id="itemDetailCost"></span></p>
                            <p id="itemDetailWeight"><strong>Weight:</strong> <span id="itemDetailWeightValue"></span></p>
                            <div id="itemDetailDescription"></div>

                            <div class="add-item-quantity-controls">
                                <label>Quantity:</label>
                                <input type="number" id="itemDatabaseQuantity" class="form-control" min="1" value="1" style="width: 80px;">
                            </div>

                            <div id="itemTotalCost" class="item-total-cost"></div>
                            <div id="purchaseAffordability" class="purchase-affordability"></div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="buyDatabaseItem" class="btn btn-success" disabled>💰 Buy Item</button>
                        <button id="confirmAddDatabaseItem" class="btn btn-primary" disabled>Add Item (Free)</button>
                        <button id="cancelAddDatabaseItem" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Add Custom Item Modal -->
            <div id="addCustomItemModal" class="modal-overlay hidden">
                <div class="modal-content">
                    <h2>Add Custom Item</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Item Name *</label>
                            <input type="text" id="customItemName" class="form-control" placeholder="Item name" required>
                        </div>
                        <div class="form-group">
                            <label>Weight (lbs)</label>
                            <input type="number" id="customItemWeight" class="form-control" min="0" step="0.1" value="0">
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" id="customItemQuantity" class="form-control" min="1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Cost (GP)</label>
                            <input type="number" id="customItemCost" class="form-control" min="0" step="0.01" value="0">
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <input type="text" id="customItemNotes" class="form-control" placeholder="Optional notes">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="confirmAddCustomItem" class="btn btn-primary">Add Item</button>
                        <button id="cancelAddCustomItem" class="btn btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Wealth changes
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('wealth-input')) {
                const coinType = e.target.dataset.coin;
                const value = parseInt(e.target.value) || 0;
                character.updateWealth(coinType, value);
            }
        });

        // XP change
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'experienceInput') {
                const xp = parseInt(e.target.value) || 0;
                character.updateExperience(xp);
            }
        });

        // Magic item equip (blur for auto-save)
        this.container.addEventListener('blur', (e) => {
            if (e.target.classList.contains('magic-item-input')) {
                const slot = e.target.dataset.slot;
                const itemName = e.target.value.trim();
                character.equipMagicItem(slot, itemName || null);
            }
        }, true);

        // Add item button
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'addFromDatabaseBtn') {
                this.openItemDatabaseModal();
            } else if (e.target.id === 'addCustomItemBtn') {
                this.openCustomItemModal();
            } else if (e.target.classList.contains('delete-item-btn')) {
                const index = parseInt(e.target.dataset.index);
                InfoModal.confirm('Delete this item?', 'Delete Item', { confirmText: 'Delete', danger: true }).then(confirmed => {
                    if (confirmed) {
                        character.removeInventoryItem(index);
                    }
                });
            }
        });

        // Database modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'buyDatabaseItem') {
                this.buyItemFromDatabase();
            } else if (e.target.id === 'confirmAddDatabaseItem') {
                this.addItemFromDatabase();
            } else if (e.target.id === 'cancelAddDatabaseItem') {
                this.closeItemDatabaseModal();
            } else if (e.target.id === 'confirmAddCustomItem') {
                this.addCustomItem();
            } else if (e.target.id === 'cancelAddCustomItem') {
                this.closeCustomItemModal();
            } else if (e.target.closest('.item-database-entry')) {
                const itemEntry = e.target.closest('.item-database-entry');
                this.selectDatabaseItem(itemEntry.dataset.itemName, itemEntry.dataset.itemType);
            }
        });

        // Search and filter for database
        document.addEventListener('input', (e) => {
            if (e.target.id === 'itemSearch') {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderItemDatabaseList();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'itemTypeFilter') {
                this.typeFilter = e.target.value;
                this.renderItemDatabaseList();
            } else if (e.target.id === 'itemDatabaseQuantity') {
                // Update affordability when quantity changes
                this.updatePurchaseAffordability();
            }
        });

        // Edit carried item fields (inline editing)
        this.container.addEventListener('change', (e) => {
            if (e.target.classList.contains('carried-item-field')) {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                let value = e.target.value;

                // Parse numeric fields
                if (field === 'weight') {
                    value = parseFloat(value) || 0;
                } else if (field === 'quantity') {
                    value = Math.max(1, parseInt(value) || 1);
                    e.target.value = value; // Update display
                }

                character.updateInventoryItem(index, field, value);
            }
        });
    }

    // NEW: Open item database modal
    openItemDatabaseModal() {
        this.searchTerm = '';
        this.typeFilter = 'all';
        this.selectedDatabaseItem = null;

        document.getElementById('itemSearch').value = '';
        document.getElementById('itemTypeFilter').value = 'all';
        document.getElementById('itemDatabaseDetails').classList.add('hidden');
        document.getElementById('confirmAddDatabaseItem').disabled = true;

        document.getElementById('addItemDatabaseModal').classList.remove('hidden');
        this.renderItemDatabaseList();
    }

    // NEW: Close item database modal
    closeItemDatabaseModal() {
        document.getElementById('addItemDatabaseModal').classList.add('hidden');
        this.selectedDatabaseItem = null;
    }

    // NEW: Render item database list
    renderItemDatabaseList() {
        const list = document.getElementById('itemDatabaseList');
        if (!list) return;

        // Combine equipment, weapons, and magic items
        const allItems = [];

        // Add equipment
        dataLoader.gameData.equipment.forEach((item, name) => {
            allItems.push({ ...item, source: 'equipment', name: name });
        });

        // Add weapons
        dataLoader.gameData.weapons.forEach((weapon, name) => {
            allItems.push({ ...weapon, source: 'weapon', name: name });
        });

        // Add magic items
        dataLoader.gameData.items.forEach((item, name) => {
            // Parse magic item cost
            let cost = 0;
            if (item.price) {
                const priceStr = item.price.toString();
                // Extract number from strings like "+1 bonus" or "1000 gp"
                const match = priceStr.match(/(\d+(?:,\d+)*)/);
                if (match) {
                    cost = parseFloat(match[1].replace(/,/g, ''));
                }
            }
            allItems.push({
                ...item,
                source: 'magic',
                name: name,
                cost: cost,
                costText: item.price || 'Unknown'
            });
        });

        // Filter items
        const filteredItems = allItems.filter(item => {
            // Search filter
            if (this.searchTerm && !item.name.toLowerCase().includes(this.searchTerm)) {
                return false;
            }

            // Type filter
            if (this.typeFilter === 'equipment' && item.source !== 'equipment') {
                return false;
            } else if (this.typeFilter === 'weapons' && item.source !== 'weapon') {
                return false;
            } else if (this.typeFilter === 'magic' && item.source !== 'magic') {
                return false;
            }

            return true;
        });

        // Sort by name
        filteredItems.sort((a, b) => a.name.localeCompare(b.name));

        list.innerHTML = '';

        if (filteredItems.length === 0) {
            list.innerHTML = '<p style="text-align: center; padding: 20px;">No items found.</p>';
            return;
        }

        filteredItems.forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'item-database-entry';
            entry.dataset.itemName = item.name;
            entry.dataset.itemType = item.source;

            const costText = typeof item.cost === 'number' ? `${item.cost.toFixed(2)} GP` : (item.costText || item.cost || 'N/A');
            const category = item.family || item.category || item.subcategory ||
                           (item.source === 'weapon' ? 'Weapon' : item.source === 'magic' ? 'Magic Item' : 'Equipment');

            entry.innerHTML = `
                <div class="item-entry-header">
                    <strong>${item.name}</strong>
                    <span class="item-category-badge ${item.source === 'magic' ? 'magic-badge' : ''}">${category}</span>
                </div>
                <div class="item-entry-cost">${costText}</div>
            `;

            list.appendChild(entry);
        });
    }

    // NEW: Select item from database
    selectDatabaseItem(itemName, itemType) {
        this.selectedDatabaseItem = { name: itemName, type: itemType };

        let itemData;
        if (itemType === 'equipment') {
            itemData = dataLoader.gameData.equipment.get(itemName);
        } else if (itemType === 'weapon') {
            itemData = dataLoader.gameData.weapons.get(itemName);
        } else if (itemType === 'magic') {
            itemData = dataLoader.gameData.items.get(itemName);
        }

        if (!itemData) return;

        const detailsPanel = document.getElementById('itemDatabaseDetails');
        detailsPanel.classList.remove('hidden');

        document.getElementById('itemDetailName').textContent = itemName;

        // Show type (Ring, Wand, Belt, etc.)
        const displayType = itemData.category || itemData.family || 'Item';
        document.getElementById('itemDetailType').textContent = displayType;

        // Show category and subcategory
        const subcategory = itemData.subcategory || itemData.type || '';
        document.getElementById('itemDetailCategory').textContent = subcategory || 'General';

        // Parse cost
        let cost = 0;
        let costText = 'N/A';
        if (itemData.cost !== undefined && itemData.cost !== null) {
            if (typeof itemData.cost === 'number') {
                cost = itemData.cost;
                costText = `${cost.toFixed(2)} GP`;
            } else {
                costText = itemData.cost.toString();
                const match = costText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
                if (match) {
                    cost = parseFloat(match[1].replace(/,/g, ''));
                    costText = `${cost.toFixed(2)} GP`;
                }
            }
        } else if (itemData.costText) {
            costText = itemData.costText;
            // Try to parse cost from text
            const match = itemData.costText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
            if (match) {
                cost = parseFloat(match[1].replace(/,/g, ''));
            }
        } else if (itemData.price) {
            costText = itemData.price.toString();
            const match = costText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
            if (match) {
                cost = parseFloat(match[1].replace(/,/g, ''));
            }
        }

        document.getElementById('itemDetailCost').textContent = costText;
        this.selectedItemCost = cost;

        // Show weight
        const weight = itemData.weight || 0;
        document.getElementById('itemDetailWeightValue').textContent = `${weight} lbs`;

        // Show description if available
        const description = itemData.description || itemData.fullText || '';
        const cleanDescription = description.replace(/<[^>]*>/g, '').trim();
        if (cleanDescription) {
            document.getElementById('itemDetailDescription').textContent = cleanDescription;
        } else {
            document.getElementById('itemDetailDescription').textContent = 'No description available.';
        }

        // Enable buttons and update affordability
        document.getElementById('confirmAddDatabaseItem').disabled = false;
        this.updatePurchaseAffordability();

        // Highlight selected item
        document.querySelectorAll('.item-database-entry').forEach(entry => {
            if (entry.dataset.itemName === itemName) {
                entry.classList.add('item-entry-selected');
            } else {
                entry.classList.remove('item-entry-selected');
            }
        });
    }

    // NEW: Update purchase affordability display
    updatePurchaseAffordability() {
        const quantity = parseInt(document.getElementById('itemDatabaseQuantity').value) || 1;
        const totalCost = this.selectedItemCost * quantity;

        // Display total cost
        document.getElementById('itemTotalCost').innerHTML = `
            <strong>Total Cost:</strong> ${totalCost.toFixed(2)} GP (${quantity} × ${this.selectedItemCost.toFixed(2)} GP)
        `;

        // Check affordability
        const data = character.getData();
        const currentWealth = (data.inventory.wealth.platinum * 10) +
                              data.inventory.wealth.gold +
                              (data.inventory.wealth.silver / 10) +
                              (data.inventory.wealth.copper / 100);

        const buyButton = document.getElementById('buyDatabaseItem');
        const affordabilityDiv = document.getElementById('purchaseAffordability');

        if (currentWealth >= totalCost) {
            affordabilityDiv.innerHTML = `
                <div class="can-afford">
                    ✅ You can afford this! (You have ${currentWealth.toFixed(2)} GP)
                </div>
            `;
            buyButton.disabled = false;
        } else {
            const shortage = totalCost - currentWealth;
            affordabilityDiv.innerHTML = `
                <div class="cannot-afford">
                    ❌ Not enough money! (Short by ${shortage.toFixed(2)} GP)
                </div>
            `;
            buyButton.disabled = true;
        }
    }

    // NEW: Buy item from database (deduct money)
    buyItemFromDatabase() {
        if (!this.selectedDatabaseItem) return;

        const { name, type } = this.selectedDatabaseItem;
        let itemData;

        if (type === 'equipment') {
            itemData = dataLoader.gameData.equipment.get(name);
        } else if (type === 'weapon') {
            itemData = dataLoader.gameData.weapons.get(name);
        } else if (type === 'magic') {
            itemData = dataLoader.gameData.items.get(name);
        }

        if (!itemData) return;

        const quantity = parseInt(document.getElementById('itemDatabaseQuantity').value) || 1;
        const cost = this.selectedItemCost || 0;
        const totalCost = cost * quantity;
        const weight = itemData.weight || 0;

        // Check if can afford
        const data = character.getData();
        const currentWealth = (data.inventory.wealth.platinum * 10) +
                              data.inventory.wealth.gold +
                              (data.inventory.wealth.silver / 10) +
                              (data.inventory.wealth.copper / 100);

        if (currentWealth < totalCost) {
            InfoModal.toast('Not enough money to buy this item!', 'error');
            return;
        }

        // Deduct money (convert to GP, then back to coins)
        const newWealth = currentWealth - totalCost;

        // Convert GP to coins (prefer gold, then platinum)
        const newPlatinum = Math.floor(newWealth / 10);
        const remainderAfterPP = newWealth - (newPlatinum * 10);
        const newGold = Math.floor(remainderAfterPP);
        const remainderAfterGP = remainderAfterPP - newGold;
        const newSilver = Math.floor(remainderAfterGP * 10);
        const remainderAfterSP = (remainderAfterGP * 10) - newSilver;
        const newCopper = Math.round(remainderAfterSP * 10);

        // Update wealth
        character.updateWealth('platinum', newPlatinum);
        character.updateWealth('gold', newGold);
        character.updateWealth('silver', newSilver);
        character.updateWealth('copper', newCopper);

        // Add item to inventory
        character.addInventoryItem({
            name: name,
            source: 'database',
            itemId: name,
            weight: weight,
            quantity: quantity,
            cost: cost,
            properties: {},
            notes: 'Purchased'
        });

        InfoModal.toast(`Purchased ${quantity}\u00D7 ${name} for ${totalCost.toFixed(2)} GP!`, 'success');
        this.closeItemDatabaseModal();
    }

    // NEW: Add item from database
    addItemFromDatabase() {
        if (!this.selectedDatabaseItem) return;

        const { name, type } = this.selectedDatabaseItem;
        let itemData;

        if (type === 'equipment') {
            itemData = dataLoader.gameData.equipment.get(name);
        } else if (type === 'weapon') {
            itemData = dataLoader.gameData.weapons.get(name);
        }

        if (!itemData) return;

        const quantity = parseInt(document.getElementById('itemDatabaseQuantity').value) || 1;
        const cost = itemData.cost || 0;
        const weight = itemData.weight || 0;

        character.addInventoryItem({
            name: name,
            source: 'database',
            itemId: name,
            weight: weight,
            quantity: quantity,
            cost: cost,
            properties: {},
            notes: ''
        });

        this.closeItemDatabaseModal();
    }

    // NEW: Open custom item modal
    openCustomItemModal() {
        document.getElementById('customItemName').value = '';
        document.getElementById('customItemWeight').value = '0';
        document.getElementById('customItemQuantity').value = '1';
        document.getElementById('customItemCost').value = '0';
        document.getElementById('customItemNotes').value = '';

        document.getElementById('addCustomItemModal').classList.remove('hidden');
        document.getElementById('customItemName').focus();
    }

    // NEW: Close custom item modal
    closeCustomItemModal() {
        document.getElementById('addCustomItemModal').classList.add('hidden');
    }

    // NEW: Add custom item
    addCustomItem() {
        const name = document.getElementById('customItemName').value.trim();
        const weight = parseFloat(document.getElementById('customItemWeight').value) || 0;
        const quantity = parseInt(document.getElementById('customItemQuantity').value) || 1;
        const cost = parseFloat(document.getElementById('customItemCost').value) || 0;
        const notes = document.getElementById('customItemNotes').value.trim();

        if (!name) {
            InfoModal.toast('Please enter an item name.', 'warning');
            return;
        }

        character.addInventoryItem({
            name,
            source: 'custom',
            itemId: null,
            weight,
            quantity,
            cost,
            properties: {},
            notes
        });

        this.closeCustomItemModal();
    }

    render(stats) {
        if (!stats) return;

        const data = character.getData();

        // Update wealth inputs
        document.getElementById('wealthPlatinum').value = data.inventory.wealth.platinum || 0;
        document.getElementById('wealthGold').value = data.inventory.wealth.gold || 0;
        document.getElementById('wealthSilver').value = data.inventory.wealth.silver || 0;
        document.getElementById('wealthCopper').value = data.inventory.wealth.copper || 0;

        // Calculate and display total wealth in GP
        const totalGP = (data.inventory.wealth.platinum * 10) +
                        data.inventory.wealth.gold +
                        (data.inventory.wealth.silver / 10) +
                        (data.inventory.wealth.copper / 100);
        document.getElementById('wealthTotal').innerHTML = `<strong>Total: ${totalGP.toFixed(2)} GP</strong>`;

        // Update XP
        document.getElementById('experienceInput').value = data.inventory.experience || 0;

        // Update XP progress bar
        const currentLevel = data.level;
        const currentXP = data.inventory.experience;
        const currentLevelXP = calculator.calculateNextLevelXP(currentLevel - 1);
        const nextLevelXP = calculator.calculateNextLevelXP(currentLevel);

        const progress = currentLevel >= 20 ? 100 : ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100);
        const xpNeeded = Math.max(0, nextLevelXP - currentXP);

        document.getElementById('xpProgress').innerHTML = `
            <div class="xp-progress-bar-container">
                <div class="xp-progress-bar" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
            </div>
            <p class="info-text">
                ${currentLevel >= 20 ? 'Max level reached' : `${xpNeeded} XP needed for level ${currentLevel + 1}`}
            </p>
        `;

        // Update carrying capacity
        this.renderCarryingCapacity(stats, data);

        // Update magic items
        Object.keys(data.inventory.magicItems).forEach(slot => {
            const input = this.container.querySelector(`.magic-item-input[data-slot="${slot}"]`);
            if (input) {
                input.value = data.inventory.magicItems[slot] || '';
            }
        });

        // Update carried items table
        this.renderCarriedItems(data);
    }

    renderCarryingCapacity(stats, data) {
        const capacity = stats.carryingCapacity;
        const currentWeight = data.inventory.totalWeight || 0;

        let loadStatus = 'Light Load';
        let loadClass = 'light';
        let penalties = 'No penalties';

        if (currentWeight > capacity.medium) {
            loadStatus = 'Heavy Load';
            loadClass = 'heavy';
            penalties = 'Speed -20 ft, Max DEX +1, Check penalty -6';
        } else if (currentWeight > capacity.light) {
            loadStatus = 'Medium Load';
            loadClass = 'medium';
            penalties = 'Speed -10 ft, Max DEX +3, Check penalty -3';
        }

        const percentage = (currentWeight / capacity.heavy) * 100;

        document.getElementById('carryingCapacityDisplay').innerHTML = `
            <div class="capacity-info">
                <div class="capacity-row">
                    <span><strong>Current Weight:</strong> ${currentWeight.toFixed(1)} lbs</span>
                    <span class="load-status ${loadClass}"><strong>${loadStatus}</strong></span>
                </div>
                <div class="capacity-bar-container">
                    <div class="capacity-bar ${loadClass}" style="width: ${Math.min(100, percentage)}%"></div>
                </div>
                <div class="capacity-thresholds">
                    <div><strong>Light:</strong> 0-${capacity.light} lbs</div>
                    <div><strong>Medium:</strong> ${capacity.light + 1}-${capacity.medium} lbs</div>
                    <div><strong>Heavy:</strong> ${capacity.medium + 1}-${capacity.heavy} lbs</div>
                    <div><strong>Max Lift:</strong> ${capacity.lift} lbs</div>
                </div>
                <p class="info-text"><strong>Effects:</strong> ${penalties}</p>
            </div>
        `;
    }

    renderCarriedItems(data) {
        const tbody = document.getElementById('carriedItemsBody');
        tbody.innerHTML = '';

        if (data.inventory.carriedItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No items carried. Click "Add from Database" or "Add Custom Item" to add equipment.</td></tr>';
        } else {
            data.inventory.carriedItems.forEach((item, index) => {
                const row = document.createElement('tr');
                const sourceIcon = item.source === 'database' ? '📚' : '✏️';
                row.innerHTML = `
                    <td>
                        <span title="${item.source === 'database' ? 'From database' : 'Custom item'}">${sourceIcon}</span>
                        <input type="text" class="form-control carried-item-field"
                               data-index="${index}" data-field="name"
                               value="${item.name}">
                    </td>
                    <td>
                        <input type="number" class="form-control carried-item-field"
                               data-index="${index}" data-field="weight"
                               value="${item.weight}" min="0" step="0.1" style="width: 80px;">
                    </td>
                    <td>
                        <input type="number" class="form-control carried-item-field"
                               data-index="${index}" data-field="quantity"
                               value="${item.quantity}" min="1" style="width: 60px;">
                    </td>
                    <td>
                        <input type="number" class="form-control carried-item-field"
                               data-index="${index}" data-field="cost"
                               value="${item.cost || 0}" min="0" step="0.01" style="width: 80px;">
                    </td>
                    <td>
                        <input type="text" class="form-control carried-item-field"
                               data-index="${index}" data-field="notes"
                               value="${item.notes || ''}">
                    </td>
                    <td>
                        <button class="btn btn-small btn-danger delete-item-btn" data-index="${index}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Update total weight display
        document.getElementById('totalWeightDisplay').innerHTML = `<strong>${data.inventory.totalWeight.toFixed(1)} lbs</strong>`;
    }
}

window.InventoryTab = InventoryTab;

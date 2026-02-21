// gameLogTab.js - Game Log Tab UI

class GameLogTab {
    constructor() {
        this.container = document.getElementById('gamelogTabContent');
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Add Log Entry</h2>
                <div class="add-log-form">
                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label for="logMessage">Message</label>
                            <textarea id="logMessage" class="form-control" rows="3" placeholder="Describe what happened..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="logType">Type</label>
                            <select id="logType" class="form-control">
                                <option value="manual">Manual Entry</option>
                                <option value="level_up">Level Up</option>
                                <option value="ability_increase">Ability Increase</option>
                                <option value="wealth_change">Wealth Change</option>
                                <option value="xp_gain">XP Gain</option>
                                <option value="combat">Combat</option>
                            </select>
                        </div>
                    </div>
                    <button id="addLogEntryBtn" class="btn btn-primary">Add Entry</button>
                </div>
            </div>

            <div class="card">
                <h2>Filters</h2>
                <div class="log-filters">
                    <div class="form-group" style="display: inline-block; margin-right: 15px;">
                        <label for="logTypeFilter">Type</label>
                        <select id="logTypeFilter" class="form-control" style="width: 200px;">
                            <option value="all">All Entries</option>
                            <option value="level_up">Level Ups</option>
                            <option value="ability_increase">Ability Increases</option>
                            <option value="wealth_change">Wealth Changes</option>
                            <option value="xp_gain">XP Gains</option>
                            <option value="combat">Combat</option>
                            <option value="manual">Manual Entries</option>
                        </select>
                    </div>
                    <div class="form-group" style="display: inline-block; margin-right: 15px;">
                        <label for="logSearch">Search</label>
                        <input type="text" id="logSearch" class="form-control" placeholder="Search entries..." style="width: 250px;">
                    </div>
                    <button id="clearFiltersBtn" class="btn btn-secondary btn-small" style="margin-top: 24px;">Clear Filters</button>
                </div>
            </div>

            <div class="card">
                <h2>Log Entries</h2>
                <div id="logEntriesContainer" class="log-entries-container">
                    <!-- Log entries will be added dynamically -->
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add entry button
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'addLogEntryBtn') {
                this.addLogEntry();
            }
        });

        // Delete entry button
        this.container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-log-btn')) {
                const index = parseInt(e.target.dataset.index);
                const confirmed = await InfoModal.confirm('Delete this log entry?', 'Delete Entry', { confirmText: 'Delete', danger: true });
                if (confirmed) {
                    this.deleteLogEntry(index);
                }
            }
        });

        // Filter changes
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'logTypeFilter') {
                this.currentFilter = e.target.value;
                this.renderLogEntries();
            }
        });

        // Search input
        this.container.addEventListener('input', (e) => {
            if (e.target.id === 'logSearch') {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderLogEntries();
            }
        });

        // Clear filters
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'clearFiltersBtn') {
                document.getElementById('logTypeFilter').value = 'all';
                document.getElementById('logSearch').value = '';
                this.currentFilter = 'all';
                this.searchTerm = '';
                this.renderLogEntries();
            }
        });
    }

    addLogEntry() {
        const message = document.getElementById('logMessage').value.trim();
        const type = document.getElementById('logType').value;

        if (!message) {
            InfoModal.toast('Please enter a message.', 'warning');
            return;
        }

        character.addGameLogEntry({
            type,
            message,
            details: {}
        });

        // Clear form
        document.getElementById('logMessage').value = '';
        document.getElementById('logType').value = 'manual';
    }

    deleteLogEntry(index) {
        const data = character.getData();
        data.gameLog.splice(index, 1);
        character.setData(data);
    }

    render() {
        this.renderLogEntries();
    }

    renderLogEntries() {
        const data = character.getData();
        const container = document.getElementById('logEntriesContainer');

        if (!data.gameLog || data.gameLog.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No log entries yet. Start your adventure!</p>
                </div>
            `;
            return;
        }

        // Filter entries
        let filteredEntries = data.gameLog;

        // Filter by type
        if (this.currentFilter !== 'all') {
            filteredEntries = filteredEntries.filter(entry => entry.type === this.currentFilter);
        }

        // Filter by search term
        if (this.searchTerm) {
            filteredEntries = filteredEntries.filter(entry =>
                entry.message.toLowerCase().includes(this.searchTerm)
            );
        }

        if (filteredEntries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No entries match your filters.</p>
                </div>
            `;
            return;
        }

        // Reverse chronological order (newest first)
        const sortedEntries = [...filteredEntries].reverse();

        // Render entries
        container.innerHTML = sortedEntries.map((entry, reverseIndex) => {
            const originalIndex = data.gameLog.length - 1 - reverseIndex;
            const typeInfo = this.getTypeInfo(entry.type);
            const timestamp = this.formatTimestamp(entry.timestamp);

            return `
                <div class="log-entry">
                    <div class="log-entry-header">
                        <span class="log-type-badge" style="background: ${typeInfo.color};">
                            ${typeInfo.icon} ${typeInfo.label}
                        </span>
                        <span class="log-timestamp">${timestamp}</span>
                        <button class="btn btn-small btn-danger delete-log-btn" data-index="${originalIndex}">Delete</button>
                    </div>
                    <div class="log-entry-message">${entry.message}</div>
                </div>
            `;
        }).join('');
    }

    getTypeInfo(type) {
        const types = {
            level_up: { color: '#4CAF50', icon: '⬆️', label: 'Level Up' },
            ability_increase: { color: '#2196F3', icon: '💪', label: 'Ability Increase' },
            wealth_change: { color: '#FFC107', icon: '💰', label: 'Wealth Change' },
            xp_gain: { color: '#9C27B0', icon: '⭐', label: 'XP Gain' },
            combat: { color: '#F44336', icon: '⚔️', label: 'Combat' },
            manual: { color: '#607D8B', icon: '📝', label: 'Manual Entry' }
        };

        return types[type] || types.manual;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown time';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        // Relative time for recent entries
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        // Absolute time for older entries
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }
}

window.GameLogTab = GameLogTab;

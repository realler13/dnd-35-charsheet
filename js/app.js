// app.js - Main Application Controller

class DnDCharacterSheet {
    constructor() {
        this.initialized = false;
        this.currentTab = 'character';
        this.stats = null;
    }

    // Initialize theme from localStorage (called early to prevent flash)
    initTheme() {
        const saved = localStorage.getItem('dnd35_theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        if (next === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('dnd35_theme', next);
    }

    // Initialize the application
    async init() {
        console.log('Initializing D&D 3.5 Character Sheet...');

        // Apply saved theme immediately
        this.initTheme();

        try {
            // Load game data
            await dataLoader.loadAllData();

            // Initialize calculator
            window.calculator = initializeCalculator(dataLoader);

            // Initialize character with skills
            character.initializeSkills(dataLoader.gameData.skills);

            // Setup character change listener
            character.addListener((data) => {
                this.onCharacterChange(data);
                characterStorage.markDirty();
            });

            // Setup tab navigation
            this.setupTabNavigation();

            // Setup character management
            this.setupCharacterManagement();

            // Initialize all tab UIs
            this.initializeTabs();

            // Load last character or create new
            this.loadLastCharacter();

            // Initial calculation and render
            this.recalculateAll();

            this.initialized = true;
            console.log('Application initialized successfully');

        } catch (error) {
            console.error('Error initializing application:', error);
            if (window.InfoModal) {
                InfoModal.toast('Error loading application. Check the console for details.', 'error', 8000);
            }
        }
    }

    // Setup tab navigation
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('[data-tab]');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    // Switch to a different tab
    switchTab(tabName) {
        // Update button states
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab pane visibility
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;

        // Refresh the current tab
        this.refreshCurrentTab();
    }

    // Setup character management (new, load, save, export, import)
    setupCharacterManagement() {
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // New character
        const newBtn = document.getElementById('newCharacter');
        if (newBtn) {
            newBtn.addEventListener('click', () => this.newCharacter());
        }

        // Save character
        const saveBtn = document.getElementById('saveCharacter');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCharacter());
        }

        // Export character
        const exportBtn = document.getElementById('exportCharacter');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCharacter());
        }

        // Import character
        const importBtn = document.getElementById('importCharacter');
        const importFile = document.getElementById('importFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.importCharacter(e));
        }

        // Load character
        const loadBtn = document.getElementById('loadCharacter');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => this.showLoadCharacterDialog());
        }

        // Print / PDF
        const printBtn = document.getElementById('printCharacter');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                if (window.pdfExport) {
                    window.pdfExport.print();
                }
            });
        }
    }

    // Initialize all tab UIs
    initializeTabs() {
        // Each tab UI module will initialize itself
        if (window.CharacterTab) window.characterTab = new CharacterTab();
        if (window.AbilitiesTab) window.abilitiesTab = new AbilitiesTab();
        if (window.ClassesTab) window.classesTab = new ClassesTab();
        if (window.SkillsTab) window.skillsTab = new SkillsTab();
        if (window.FeatsTab) window.featsTab = new FeatsTab();
        if (window.InventoryTab) window.inventoryTab = new InventoryTab();
        if (window.SpellsTab) window.spellsTab = new SpellsTab();
        if (window.GameLogTab) window.gameLogTab = new GameLogTab();
    }

    // Refresh current tab display
    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'character':
                if (window.characterTab) window.characterTab.render(this.stats);
                break;
            case 'abilities':
                if (window.abilitiesTab) window.abilitiesTab.render();
                break;
            case 'classes':
                if (window.classesTab) window.classesTab.render();
                break;
            case 'skills':
                if (window.skillsTab) window.skillsTab.render(this.stats);
                break;
            case 'feats':
                if (window.featsTab) window.featsTab.render(this.stats);
                break;
            case 'inventory':
                if (window.inventoryTab) window.inventoryTab.render(this.stats);
                break;
            case 'spells':
                if (window.spellsTab) window.spellsTab.render(this.stats);
                break;
            case 'gamelog':
                if (window.gameLogTab) window.gameLogTab.render();
                break;
        }
    }

    // Character change handler
    onCharacterChange(data) {
        this.recalculateAll();
    }

    // Recalculate all stats
    recalculateAll() {
        const characterData = character.getData();
        this.stats = calculator.calculateAll(characterData);

        // Update all tabs
        this.refreshCurrentTab();

        // Update character name in header
        const nameDisplay = document.getElementById('charNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = characterData.name;
        }
    }

    // New character
    async newCharacter() {
        const confirmed = await InfoModal.confirm(
            'Create a new character? Any unsaved changes will be lost.',
            'New Character',
            { confirmText: 'Create New', danger: true }
        );
        if (confirmed) {
            character.setData(character.createDefaultCharacter());
            character.initializeSkills(dataLoader.gameData.skills);
            this.recalculateAll();
            characterStorage.clearAutosave();
            console.log('New character created');
        }
    }

    // Save character
    saveCharacter() {
        const saved = characterStorage.saveCharacter(character.getData());
        if (saved) {
            InfoModal.toast('Character saved!', 'success');
        }
    }

    // Export character
    exportCharacter() {
        characterStorage.exportToFile(character.getData());
    }

    // Import character
    importCharacter(event) {
        const file = event.target.files[0];
        if (!file) return;

        characterStorage.importFromFile(file, (success, data) => {
            if (success) {
                character.setData(data);
                this.recalculateAll();
                InfoModal.toast('Character imported successfully!', 'success');
            } else {
                InfoModal.toast('Error importing character file.', 'error');
            }
        });

        // Clear file input
        event.target.value = '';
    }

    // Show load character dialog
    showLoadCharacterDialog() {
        const characterList = characterStorage.getCharacterList();

        if (characterList.length === 0) {
            InfoModal.toast('No saved characters found.', 'info');
            return;
        }

        InfoModal.showCharacterLoadModal(
            characterList,
            (name) => this.loadCharacter(name),
            (name) => characterStorage.deleteCharacter(name)
        );
    }

    // Load character by name
    loadCharacter(characterName) {
        const data = characterStorage.loadCharacter(characterName);
        if (data) {
            character.setData(data);
            this.recalculateAll();
            InfoModal.toast(`Loaded: ${characterName}`, 'success');
            console.log(`Loaded character: ${characterName}`);
        } else {
            InfoModal.toast(`Could not load character: ${characterName}`, 'error');
        }
    }

    // Load last character from localStorage
    loadLastCharacter() {
        const characterList = characterStorage.getCharacterList();
        if (characterList.length > 0) {
            // Load the first character in the list
            this.loadCharacter(characterList[0]);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DnDCharacterSheet();
    window.app.init();
});

// Make character accessible globally for convenience
window.character = character;

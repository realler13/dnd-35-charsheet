// app.js - Main Application Controller

class DnDCharacterSheet {
    constructor() {
        this.initialized = false;
        this.currentTab = 'character';
        this.stats = null;
    }

    // Initialize the application
    async init() {
        console.log('Initializing D&D 3.5 Character Sheet...');

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
            alert('Error loading application. Please check the console for details.');
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
    newCharacter() {
        if (confirm('Create a new character? Any unsaved changes will be lost.')) {
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
            alert('Character saved successfully!');
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
                alert('Character imported successfully!');
            } else {
                alert('Error importing character file.');
            }
        });

        // Clear file input
        event.target.value = '';
    }

    // Show load character dialog
    showLoadCharacterDialog() {
        const characterList = characterStorage.getCharacterList();

        if (characterList.length === 0) {
            alert('No saved characters found.');
            return;
        }

        let message = 'Select a character to load:\n\n';
        characterList.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });

        const selection = prompt(message + '\nEnter character number:');
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < characterList.length) {
                this.loadCharacter(characterList[index]);
            }
        }
    }

    // Load character by name
    loadCharacter(characterName) {
        const data = characterStorage.loadCharacter(characterName);
        if (data) {
            character.setData(data);
            this.recalculateAll();
            console.log(`Loaded character: ${characterName}`);
        } else {
            alert(`Could not load character: ${characterName}`);
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

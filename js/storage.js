// storage.js - localStorage and export/import system

class CharacterStorage {
    constructor() {
        this.storagePrefix = 'dnd35_character_';
        this.listKey = 'dnd35_character_list';
        this.autosaveDelay = 5000; // 5 seconds
        this.autosaveTimer = null;
        this.isDirty = false;
    }

    // Get all saved character names
    getCharacterList() {
        const listJSON = localStorage.getItem(this.listKey);
        if (listJSON) {
            try {
                return JSON.parse(listJSON);
            } catch (error) {
                console.error('Error parsing character list:', error);
                return [];
            }
        }
        return [];
    }

    // Save character list
    saveCharacterList(list) {
        localStorage.setItem(this.listKey, JSON.stringify(list));
    }

    // Add character to list
    addToCharacterList(characterName) {
        const list = this.getCharacterList();
        if (!list.includes(characterName)) {
            list.push(characterName);
            this.saveCharacterList(list);
        }
    }

    // Remove character from list
    removeFromCharacterList(characterName) {
        let list = this.getCharacterList();
        list = list.filter(name => name !== characterName);
        this.saveCharacterList(list);
    }

    // Save character to localStorage
    saveCharacter(characterData) {
        const characterName = characterData.name || 'Unnamed Character';
        const key = this.storagePrefix + characterName;

        const saveData = {
            version: '1.0',
            savedAt: new Date().toISOString(),
            data: characterData
        };

        try {
            localStorage.setItem(key, JSON.stringify(saveData));
            this.addToCharacterList(characterName);
            this.isDirty = false;
            console.log(`Character "${characterName}" saved to localStorage`);
            return true;
        } catch (error) {
            console.error('Error saving character:', error);
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please export your character to a file.');
            }
            return false;
        }
    }

    // Load character from localStorage
    loadCharacter(characterName) {
        const key = this.storagePrefix + characterName;

        try {
            const saveDataJSON = localStorage.getItem(key);
            if (saveDataJSON) {
                const saveData = JSON.parse(saveDataJSON);
                console.log(`Character "${characterName}" loaded from localStorage`);
                return saveData.data;
            }
        } catch (error) {
            console.error('Error loading character:', error);
        }

        return null;
    }

    // Delete character from localStorage
    deleteCharacter(characterName) {
        const key = this.storagePrefix + characterName;

        try {
            localStorage.removeItem(key);
            this.removeFromCharacterList(characterName);
            console.log(`Character "${characterName}" deleted`);
            return true;
        } catch (error) {
            console.error('Error deleting character:', error);
            return false;
        }
    }

    // Mark character as dirty (needs save)
    markDirty() {
        this.isDirty = true;
        this.scheduleAutosave();
    }

    // Schedule autosave
    scheduleAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }

        this.autosaveTimer = setTimeout(() => {
            if (this.isDirty && window.character) {
                this.saveCharacter(window.character.getData());
            }
        }, this.autosaveDelay);
    }

    // Export character to JSON file
    exportToFile(characterData) {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: characterData
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });

        const characterName = characterData.name || 'Unnamed';
        const level = characterData.level || 1;
        const filename = `${characterName.replace(/\s+/g, '_')}_Level${level}.json`;

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Character exported to ${filename}`);
    }

    // Import character from JSON file
    importFromFile(file, callback) {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const importData = JSON.parse(event.target.result);

                // Validate structure
                if (importData.data) {
                    console.log('Character imported from file');
                    callback(true, importData.data);
                } else {
                    console.error('Invalid character file format');
                    callback(false, null);
                }
            } catch (error) {
                console.error('Error parsing character file:', error);
                callback(false, null);
            }
        };

        reader.onerror = () => {
            console.error('Error reading character file');
            callback(false, null);
        };

        reader.readAsText(file);
    }

    // Clear all autosave timers
    clearAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    // Get storage usage info
    getStorageInfo() {
        try {
            let totalSize = 0;
            const characterList = this.getCharacterList();

            characterList.forEach(name => {
                const key = this.storagePrefix + name;
                const data = localStorage.getItem(key);
                if (data) {
                    totalSize += data.length;
                }
            });

            return {
                characterCount: characterList.length,
                totalSize: totalSize,
                totalSizeKB: Math.round(totalSize / 1024)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
}

// Export singleton instance
const characterStorage = new CharacterStorage();

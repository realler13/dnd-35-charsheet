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
                if (window.InfoModal) {
                    InfoModal.toast('Storage quota exceeded. Please export your character to a file.', 'error', 6000);
                }
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

    // Export character to ZIP file (with portrait as separate image)
    async exportToFile(characterData) {
        const characterName = characterData.name || 'Unnamed';
        const level = characterData.level || 1;
        const filename = `${characterName.replace(/\s+/g, '_')}_Level${level}.zip`;

        // Clone data and extract portrait for separate storage in zip
        const clonedData = JSON.parse(JSON.stringify(characterData));
        const portrait = clonedData.portrait || '';
        clonedData.portrait = ''; // Don't embed base64 in JSON

        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: clonedData
        };

        const zip = new JSZip();
        zip.file('character.json', JSON.stringify(exportData, null, 2));

        // If portrait exists, decode base64 and add as image file
        if (portrait) {
            const match = portrait.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/);
            if (match) {
                const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                const imageData = match[2];
                zip.file(`portrait.${ext}`, imageData, { base64: true });
            }
        }

        // Tauri: native Save As dialog
        if (window.__TAURI__) {
            const path = await window.__TAURI__.dialog.save({
                defaultPath: filename,
                filters: [{ name: 'Character Archive', extensions: ['zip'] }]
            });
            if (!path) return; // User cancelled
            const bytes = await zip.generateAsync({ type: 'uint8array' });
            await window.__TAURI__.fs.writeFile(path, bytes);
            console.log(`Character exported to ${path}`);
        } else {
            // Browser: anchor-download fallback
            const blob = await zip.generateAsync({ type: 'blob' });
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
    }

    // Import character from file (ZIP or JSON for backward compat)
    importFromFile(file, callback) {
        const name = file.name.toLowerCase();

        if (name.endsWith('.zip')) {
            this._importFromZip(file, callback);
        } else {
            this._importFromJSON(file, callback);
        }
    }

    // Import from legacy JSON file
    _importFromJSON(file, callback) {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const importData = JSON.parse(event.target.result);

                // Validate structure
                if (importData.data) {
                    console.log('Character imported from JSON file');
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

    // Import from ZIP file
    async _importFromZip(file, callback) {
        try {
            const zip = await JSZip.loadAsync(file);

            // Read character.json
            const jsonFile = zip.file('character.json');
            if (!jsonFile) {
                console.error('ZIP does not contain character.json');
                callback(false, null);
                return;
            }

            const jsonText = await jsonFile.async('text');
            const importData = JSON.parse(jsonText);

            if (!importData.data) {
                console.error('Invalid character file format in ZIP');
                callback(false, null);
                return;
            }

            // Look for portrait image file
            const imageFile = zip.file(/^portrait\.(png|jpe?g|gif|webp)$/i)[0];
            if (imageFile) {
                const imageData = await imageFile.async('base64');
                const ext = imageFile.name.split('.').pop().toLowerCase();
                const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                importData.data.portrait = `data:${mimeType};base64,${imageData}`;
            }

            console.log('Character imported from ZIP file');
            callback(true, importData.data);
        } catch (error) {
            console.error('Error importing ZIP file:', error);
            callback(false, null);
        }
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

// characterTab.js - Character Tab UI (Main Character Sheet Display)

class CharacterTab {
    constructor() {
        this.container = document.getElementById('characterTabContent');
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <!-- Basic Info -->
            <div class="card">
                <h2>Character Information</h2>
                <div class="char-info-with-portrait">
                    <div class="char-info-column">
                        <div class="char-info-grid">
                            <div class="form-group">
                                <label for="charNameInput">Name:</label>
                                <input type="text" id="charNameInput" class="form-control" placeholder="Character Name">
                            </div>
                            <div class="info-display">
                                <label>Race:</label>
                                <span id="charRace">-</span>
                            </div>
                            <div class="info-display">
                                <label>Class:</label>
                                <span id="charClass">-</span>
                            </div>
                            <div class="info-display">
                                <label>Level:</label>
                                <span id="charLevel" class="char-level-value">1</span>
                            </div>
                        </div>
                        <div class="char-xp-tracker">
                            <div class="xp-progress-bar-container">
                                <div class="xp-progress-bar" id="charXpBar" style="width: 0%"></div>
                            </div>
                            <div class="char-xp-info">
                                <span id="charXpCurrent">0 XP</span>
                                <span id="charXpNext">Next: 1,000 XP</span>
                                <span id="charXpNeeded">1,000 XP needed</span>
                            </div>
                            <div id="charXpPenalty" class="xp-penalty-warning" style="display: none;"></div>
                            <div class="char-xp-controls">
                                <div class="form-group" style="margin-bottom:0">
                                    <label for="charXpInput">Total XP:</label>
                                    <input type="number" id="charXpInput" class="form-control" value="0" min="0">
                                </div>
                                <div class="char-xp-add-group">
                                    <input type="number" id="charXpAddAmount" class="form-control" placeholder="+XP" min="0">
                                    <button id="charXpAddBtn" class="btn btn-primary btn-small">Add XP</button>
                                </div>
                            </div>
                        </div>
                        <div class="char-info-grid" style="margin-top: 12px;">
                            <div class="info-display">
                                <label>Size:</label>
                                <span id="charSize">Medium</span>
                            </div>
                            <div class="form-group">
                                <label for="charAlignment">Alignment:</label>
                                <select id="charAlignment" class="form-control">
                                    <option value="">Select</option>
                                    <option value="Lawful Good">Lawful Good</option>
                                    <option value="Neutral Good">Neutral Good</option>
                                    <option value="Chaotic Good">Chaotic Good</option>
                                    <option value="Lawful Neutral">Lawful Neutral</option>
                                    <option value="True Neutral">True Neutral</option>
                                    <option value="Chaotic Neutral">Chaotic Neutral</option>
                                    <option value="Lawful Evil">Lawful Evil</option>
                                    <option value="Neutral Evil">Neutral Evil</option>
                                    <option value="Chaotic Evil">Chaotic Evil</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="portrait-section">
                        <div class="portrait-frame" id="portraitFrame">
                            <img id="portraitImage" class="portrait-image" alt="Character portrait">
                            <div id="portraitPlaceholder" class="portrait-placeholder">
                                <div class="portrait-placeholder-icon">&#x1F464;</div>
                                <div class="portrait-placeholder-text">Drop image here<br>or click to browse</div>
                            </div>
                            <div id="portraitDropOverlay" class="portrait-drop-overlay">Drop image</div>
                            <div id="portraitControls" class="portrait-controls">
                                <button id="portraitChangeBtn" class="portrait-ctrl-btn" title="Upload new portrait">&#x2B06;</button>
                                <button id="portraitRemoveBtn" class="portrait-ctrl-btn portrait-ctrl-remove" title="Remove portrait">&#x2715;</button>
                            </div>
                        </div>
                        <input type="file" id="portraitFileInput" accept="image/png,image/jpeg,image/gif,image/webp" style="display: none;">
                    </div>
                </div>
            </div>

            <!-- Portrait Lightbox -->
            <div id="portraitLightbox" class="portrait-lightbox">
                <div class="portrait-lightbox-backdrop"></div>
                <div class="portrait-lightbox-content">
                    <img id="portraitLightboxImg" alt="Character portrait">
                    <button id="portraitLightboxClose" class="portrait-lightbox-close">&#x2715;</button>
                </div>
            </div>

            <!-- Ability Scores (Read-only) -->
            <div class="card">
                <h2>Ability Scores</h2>
                <div class="abilities-display-grid">
                    ${this.createAbilityDisplay('str', 'Strength')}
                    ${this.createAbilityDisplay('dex', 'Dexterity')}
                    ${this.createAbilityDisplay('con', 'Constitution')}
                    ${this.createAbilityDisplay('int', 'Intelligence')}
                    ${this.createAbilityDisplay('wis', 'Wisdom')}
                    ${this.createAbilityDisplay('cha', 'Charisma')}
                </div>
                <p class="info-text">To modify ability scores, use the Abilities tab.</p>
            </div>

            <!-- Hit Points and Health -->
            <div class="card">
                <h2>Health</h2>
                <div class="health-grid">
                    <div class="stat-display large">
                        <label>Hit Points</label>
                        <div class="stat-value" id="charHP">0</div>
                    </div>
                    <div class="form-group">
                        <label for="charWounds">Wounds:</label>
                        <input type="number" id="charWounds" class="form-control" value="0" min="0">
                    </div>
                    <div class="form-group">
                        <label for="charSubdual">Subdual:</label>
                        <input type="number" id="charSubdual" class="form-control" value="0" min="0">
                    </div>
                    <div class="info-display">
                        <label>Current HP:</label>
                        <span id="charCurrentHP">0</span>
                    </div>
                </div>
            </div>

            <!-- Combat Stats -->
            <div class="card">
                <h2>Combat Statistics</h2>
                <div class="combat-grid">
                    <!-- Armor Class -->
                    <div class="stat-group">
                        <h3>Armor Class</h3>
                        <div class="stat-display large">
                            <label>Full AC</label>
                            <div class="stat-value" id="charACFull">10</div>
                        </div>
                        <div class="ac-breakdown">
                            <div class="breakdown-row">
                                <span>Flat-Footed:</span>
                                <span id="charACFlat">10</span>
                            </div>
                            <div class="breakdown-row">
                                <span>Touch:</span>
                                <span id="charACTouch">10</span>
                            </div>
                        </div>
                        <div class="ac-components">
                            <small id="acBreakdown">10 base</small>
                        </div>
                        <div class="ac-modifiers">
                            <input type="number" class="ac-input" id="acArmor" placeholder="Armor" value="0">
                            <input type="number" class="ac-input" id="acShield" placeholder="Shield" value="0">
                            <input type="number" class="ac-input" id="acNatural" placeholder="Natural" value="0">
                            <input type="number" class="ac-input" id="acDeflect" placeholder="Deflect" value="0">
                            <input type="number" class="ac-input" id="acMisc" placeholder="Misc" value="0">
                        </div>
                    </div>

                    <!-- Saves -->
                    <div class="stat-group">
                        <h3>Saving Throws</h3>
                        ${this.createSaveDisplay('fortitude', 'Fortitude')}
                        ${this.createSaveDisplay('reflex', 'Reflex')}
                        ${this.createSaveDisplay('will', 'Will')}
                    </div>

                    <!-- Attack Bonuses -->
                    <div class="stat-group">
                        <h3>Attack Bonuses</h3>
                        <div class="stat-display">
                            <label>Base Attack</label>
                            <div class="stat-value" id="charBAB">+0</div>
                        </div>
                        <div class="stat-display">
                            <label>Melee</label>
                            <div class="stat-value" id="charMelee">+0</div>
                            <small id="meleeBreakdown"></small>
                        </div>
                        <div class="stat-display">
                            <label>Ranged</label>
                            <div class="stat-value" id="charRanged">+0</div>
                            <small id="rangedBreakdown"></small>
                        </div>
                        <div class="stat-display">
                            <label>Grapple</label>
                            <div class="stat-value" id="charGrapple">+0</div>
                            <small id="grappleBreakdown"></small>
                        </div>
                    </div>

                    <!-- Initiative -->
                    <div class="stat-group">
                        <h3>Initiative</h3>
                        <div class="stat-display large">
                            <div class="stat-value" id="charInitiative">+0</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Combat Maneuvers (Activated Feat Abilities) -->
            <div class="card" id="combatManeuversCard" style="display: none;">
                <h2>Combat Maneuvers</h2>
                <p class="info-text">These feat-based abilities can be activated during combat to trade attack bonus for other benefits. Adjustments are limited by your Base Attack Bonus.</p>

                <div class="combat-maneuvers-grid">
                    <!-- Power Attack -->
                    <div id="powerAttackControl" class="maneuver-control" style="display: none;">
                        <h3>Power Attack</h3>
                        <p class="maneuver-description">Trade attack bonus for damage bonus (1:1 for one-handed, 1:2 for two-handed weapons)</p>
                        <div class="maneuver-input-group">
                            <label for="powerAttackSlider">Attack Penalty: <span id="powerAttackValue">0</span></label>
                            <input type="range" id="powerAttackSlider" class="maneuver-slider" min="0" max="0" value="0" step="1">
                            <input type="number" id="powerAttackInput" class="form-control maneuver-number-input" min="0" max="0" value="0">
                        </div>
                        <div class="maneuver-effect" id="powerAttackEffect">
                            <span class="effect-negative">-0 Attack</span> → <span class="effect-positive">+0 Damage</span>
                        </div>
                    </div>

                    <!-- Combat Expertise -->
                    <div id="combatExpertiseControl" class="maneuver-control" style="display: none;">
                        <h3>Combat Expertise</h3>
                        <p class="maneuver-description">Trade attack bonus for AC bonus (1:1 ratio)</p>
                        <div class="maneuver-input-group">
                            <label for="combatExpertiseSlider">Attack Penalty: <span id="combatExpertiseValue">0</span></label>
                            <input type="range" id="combatExpertiseSlider" class="maneuver-slider" min="0" max="0" value="0" step="1">
                            <input type="number" id="combatExpertiseInput" class="form-control maneuver-number-input" min="0" max="0" value="0">
                        </div>
                        <div class="maneuver-effect" id="combatExpertiseEffect">
                            <span class="effect-negative">-0 Attack</span> → <span class="effect-positive">+0 AC</span>
                        </div>
                    </div>
                </div>

                <button id="resetManeuversBtn" class="btn btn-secondary" style="margin-top: 15px;">Reset All Maneuvers</button>
            </div>

            <!-- Movement -->
            <div class="card">
                <h2>Movement</h2>
                <div class="movement-grid">
                    <div class="info-display">
                        <label>Land Speed:</label>
                        <span id="charMoveLand">30 ft.</span>
                    </div>
                    <div class="info-display">
                        <label>Climb:</label>
                        <span id="charMoveClimb">-</span>
                    </div>
                    <div class="info-display">
                        <label>Swim:</label>
                        <span id="charMoveSwim">-</span>
                    </div>
                    <div class="info-display">
                        <label>Fly:</label>
                        <span id="charMoveFly">-</span>
                    </div>
                </div>
            </div>

            <!-- Resistances -->
            <div class="card">
                <h2>Resistances & Special Defenses</h2>
                <div class="resistance-grid">
                    <div class="form-group">
                        <label for="charDR">Damage Reduction:</label>
                        <input type="text" id="charDR" class="form-control" placeholder="e.g., 5/magic">
                    </div>
                    <div class="form-group">
                        <label for="charFireRes">Fire:</label>
                        <input type="number" id="charFireRes" class="form-control small" value="0">
                    </div>
                    <div class="form-group">
                        <label for="charElecRes">Electricity:</label>
                        <input type="number" id="charElecRes" class="form-control small" value="0">
                    </div>
                    <div class="form-group">
                        <label for="charColdRes">Cold:</label>
                        <input type="number" id="charColdRes" class="form-control small" value="0">
                    </div>
                    <div class="form-group">
                        <label for="charAcidRes">Acid:</label>
                        <input type="number" id="charAcidRes" class="form-control small" value="0">
                    </div>
                    <div class="form-group">
                        <label for="charSonicRes">Sonic:</label>
                        <input type="number" id="charSonicRes" class="form-control small" value="0">
                    </div>
                </div>
            </div>

            <!-- Languages -->
            <div class="card">
                <h2>Languages</h2>
                <div class="languages-section">
                    <div id="languagesSummary" class="info-text"></div>
                    <div id="languagesList" class="language-list"></div>
                    <div class="language-add-controls">
                        <input type="text" id="addLanguageInput" class="form-control" list="languageDatalist" placeholder="Select or type language name" style="width: 250px;">
                        <datalist id="languageDatalist"></datalist>
                        <button id="addLanguageBtn" class="btn btn-primary btn-small">Add Language</button>
                    </div>
                    <p class="info-text" style="margin-top: 10px;">
                        <small>Common is free and doesn't count toward your language limit. Select from the dropdown or type a custom language name.</small>
                    </p>
                </div>
            </div>
        `;
    }

    createAbilityDisplay(ability, name) {
        return `
            <div class="ability-display">
                <div class="ability-name">${name}</div>
                <div class="ability-score" id="char${ability.toUpperCase()}Score">10</div>
                <div class="ability-modifier" id="char${ability.toUpperCase()}Mod">+0</div>
            </div>
        `;
    }

    createSaveDisplay(save, name) {
        return `
            <div class="save-display">
                <label>${name}</label>
                <div class="stat-value" id="char${save.charAt(0).toUpperCase() + save.slice(1)}">+0</div>
                <small id="${save}Breakdown"></small>
                <input type="number" class="save-input" id="${save}Magic" placeholder="Magic" value="0">
            </div>
        `;
    }

    attachEventListeners() {
        // Portrait system
        const portraitFrame = document.getElementById('portraitFrame');
        const portraitFileInput = document.getElementById('portraitFileInput');
        const portraitRemoveBtn = document.getElementById('portraitRemoveBtn');
        const portraitChangeBtn = document.getElementById('portraitChangeBtn');
        const portraitImage = document.getElementById('portraitImage');
        const lightbox = document.getElementById('portraitLightbox');
        const lightboxClose = document.getElementById('portraitLightboxClose');
        const lightboxBackdrop = lightbox?.querySelector('.portrait-lightbox-backdrop');

        // Click: empty = browse, has image = lightbox
        if (portraitFrame) {
            portraitFrame.addEventListener('click', (e) => {
                // Don't trigger if clicking a control button
                if (e.target.closest('.portrait-controls')) return;
                const data = character.getData();
                if (data.portrait) {
                    this.openLightbox();
                } else {
                    portraitFileInput?.click();
                }
            });
        }

        // Change button always opens file picker
        if (portraitChangeBtn) {
            portraitChangeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                portraitFileInput?.click();
            });
        }

        // Remove button
        if (portraitRemoveBtn) {
            portraitRemoveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                character.updateBasicInfo('portrait', '');
                this.renderPortrait();
            });
        }

        // File input change
        if (portraitFileInput) {
            portraitFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.processPortraitFile(file);
                e.target.value = '';
            });
        }

        // Drag and drop
        if (portraitFrame) {
            const dropOverlay = document.getElementById('portraitDropOverlay');

            portraitFrame.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                portraitFrame.classList.add('portrait-dragover');
                if (dropOverlay) dropOverlay.style.display = 'flex';
            });

            portraitFrame.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            portraitFrame.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only remove if leaving the frame entirely
                if (!portraitFrame.contains(e.relatedTarget)) {
                    portraitFrame.classList.remove('portrait-dragover');
                    if (dropOverlay) dropOverlay.style.display = 'none';
                }
            });

            portraitFrame.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                portraitFrame.classList.remove('portrait-dragover');
                if (dropOverlay) dropOverlay.style.display = 'none';

                const file = e.dataTransfer?.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.processPortraitFile(file);
                }
            });
        }

        // Lightbox close
        if (lightboxClose) lightboxClose.addEventListener('click', () => this.closeLightbox());
        if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', () => this.closeLightbox());

        // Character name
        const nameInput = document.getElementById('charNameInput');
        if (nameInput) {
            nameInput.addEventListener('change', (e) => {
                character.updateBasicInfo('name', e.target.value);
            });
        }

        // Alignment
        const alignmentSelect = document.getElementById('charAlignment');
        if (alignmentSelect) {
            alignmentSelect.addEventListener('change', (e) => {
                character.updateBasicInfo('alignment', e.target.value);
            });
        }

        // XP total input
        const xpInput = document.getElementById('charXpInput');
        if (xpInput) {
            xpInput.addEventListener('change', (e) => {
                character.updateExperience(parseInt(e.target.value) || 0);
            });
        }

        // Add XP button
        const xpAddBtn = document.getElementById('charXpAddBtn');
        if (xpAddBtn) {
            xpAddBtn.addEventListener('click', () => {
                const addInput = document.getElementById('charXpAddAmount');
                const amount = parseInt(addInput.value) || 0;
                if (amount > 0) {
                    const data = character.getData();
                    const currentXP = data.inventory.experience || 0;
                    character.updateExperience(currentXP + amount);
                    addInput.value = '';
                }
            });
        }

        // Add XP on Enter key
        const xpAddAmount = document.getElementById('charXpAddAmount');
        if (xpAddAmount) {
            xpAddAmount.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('charXpAddBtn').click();
                }
            });
        }

        // Wounds and subdual
        ['charWounds', 'charSubdual'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => {
                    const field = id === 'charWounds' ? 'wounds' : 'subdual';
                    character.updateCombatStat('hp', field, e.target.value);
                });
            }
        });

        // AC modifiers
        ['acArmor', 'acShield', 'acNatural', 'acDeflect', 'acMisc'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => {
                    const field = id.replace('ac', '').toLowerCase();
                    character.updateCombatStat('ac', field, e.target.value);
                });
            }
        });

        // Save modifiers
        ['fortitudeMagic', 'reflexMagic', 'willMagic'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => {
                    const save = id.replace('Magic', '');
                    character.updateSave(save, 'magic', e.target.value);
                });
            }
        });

        // Resistances
        ['charDR', 'charFireRes', 'charElecRes', 'charColdRes', 'charAcidRes', 'charSonicRes'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', (e) => {
                    const data = character.getData();
                    if (id === 'charDR') {
                        data.resistances.damageReduction = e.target.value;
                    } else {
                        const resistance = id.replace('char', '').replace('Res', '').toLowerCase();
                        data.resistances[resistance] = parseInt(e.target.value) || 0;
                    }
                    character.setData(data);
                });
            }
        });

        // Languages
        const addLanguageBtn = document.getElementById('addLanguageBtn');
        if (addLanguageBtn) {
            addLanguageBtn.addEventListener('click', () => {
                const input = document.getElementById('addLanguageInput');
                if (input && input.value.trim()) {
                    const result = character.addLanguage(input.value.trim());
                    if (result === true) {
                        input.value = '';
                        this.renderLanguages();
                    } else if (result === 'limit') {
                        InfoModal.toast('Language limit reached! Your Intelligence modifier determines bonus languages.', 'warning', 5000);
                    } else {
                        InfoModal.toast('Language already known!', 'warning');
                    }
                }
            });
        }

        // Language input - add on Enter key
        const addLanguageInput = document.getElementById('addLanguageInput');
        if (addLanguageInput) {
            addLanguageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('addLanguageBtn').click();
                }
            });
        }

        // Remove language buttons (event delegation)
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-language-btn')) {
                const languageName = e.target.dataset.language;
                InfoModal.confirm(`Remove ${languageName}?`, 'Remove Language', { confirmText: 'Remove', danger: true })
                    .then(confirmed => {
                        if (confirmed) {
                            character.removeLanguage(languageName);
                            this.renderLanguages();
                        }
                    });
            }
        });

        // Combat Maneuvers - Power Attack
        const powerAttackSlider = document.getElementById('powerAttackSlider');
        const powerAttackInput = document.getElementById('powerAttackInput');
        if (powerAttackSlider && powerAttackInput) {
            // Sync slider to input
            powerAttackSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                powerAttackInput.value = value;
                this.updatePowerAttack(value);
            });

            // Sync input to slider
            powerAttackInput.addEventListener('change', (e) => {
                const data = character.getData();
                const stats = calculator.calculateAll(data);
                const maxValue = stats.bab;
                let value = parseInt(e.target.value) || 0;

                // Clamp to valid range
                value = Math.max(0, Math.min(maxValue, value));
                e.target.value = value;
                powerAttackSlider.value = value;

                this.updatePowerAttack(value);
            });
        }

        // Combat Maneuvers - Combat Expertise
        const combatExpertiseSlider = document.getElementById('combatExpertiseSlider');
        const combatExpertiseInput = document.getElementById('combatExpertiseInput');
        if (combatExpertiseSlider && combatExpertiseInput) {
            // Sync slider to input
            combatExpertiseSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                combatExpertiseInput.value = value;
                this.updateCombatExpertise(value);
            });

            // Sync input to slider
            combatExpertiseInput.addEventListener('change', (e) => {
                const data = character.getData();
                const stats = calculator.calculateAll(data);
                const maxValue = stats.bab;
                let value = parseInt(e.target.value) || 0;

                // Clamp to valid range
                value = Math.max(0, Math.min(maxValue, value));
                e.target.value = value;
                combatExpertiseSlider.value = value;

                this.updateCombatExpertise(value);
            });
        }

        // Reset Maneuvers button
        const resetManeuversBtn = document.getElementById('resetManeuversBtn');
        if (resetManeuversBtn) {
            resetManeuversBtn.addEventListener('click', () => {
                this.resetAllManeuvers();
            });
        }
    }

    // Update Power Attack value
    updatePowerAttack(value) {
        const data = character.getData();
        if (!data.combat.activatedFeats) {
            data.combat.activatedFeats = { powerAttack: 0, combatExpertise: 0 };
        }
        data.combat.activatedFeats.powerAttack = value;
        character.setData(data);

        // Update display
        document.getElementById('powerAttackValue').textContent = value;
        const damageBonus = value; // 1:1 for one-handed
        const twoHandedDamage = value * 2; // 1:2 for two-handed
        document.getElementById('powerAttackEffect').innerHTML =
            `<span class="effect-negative">-${value} Attack</span> → <span class="effect-positive">+${damageBonus} Damage (one-handed) / +${twoHandedDamage} (two-handed)</span>`;
    }

    // Update Combat Expertise value
    updateCombatExpertise(value) {
        const data = character.getData();
        if (!data.combat.activatedFeats) {
            data.combat.activatedFeats = { powerAttack: 0, combatExpertise: 0 };
        }
        data.combat.activatedFeats.combatExpertise = value;
        character.setData(data);

        // Update display
        document.getElementById('combatExpertiseValue').textContent = value;
        document.getElementById('combatExpertiseEffect').innerHTML =
            `<span class="effect-negative">-${value} Attack</span> → <span class="effect-positive">+${value} AC</span>`;
    }

    // Reset all maneuvers
    resetAllManeuvers() {
        const data = character.getData();
        if (!data.combat.activatedFeats) {
            data.combat.activatedFeats = { powerAttack: 0, combatExpertise: 0 };
        }
        data.combat.activatedFeats.powerAttack = 0;
        data.combat.activatedFeats.combatExpertise = 0;
        character.setData(data);

        // Update UI
        const powerAttackSlider = document.getElementById('powerAttackSlider');
        const powerAttackInput = document.getElementById('powerAttackInput');
        if (powerAttackSlider && powerAttackInput) {
            powerAttackSlider.value = 0;
            powerAttackInput.value = 0;
            this.updatePowerAttack(0);
        }

        const combatExpertiseSlider = document.getElementById('combatExpertiseSlider');
        const combatExpertiseInput = document.getElementById('combatExpertiseInput');
        if (combatExpertiseSlider && combatExpertiseInput) {
            combatExpertiseSlider.value = 0;
            combatExpertiseInput.value = 0;
            this.updateCombatExpertise(0);
        }
    }

    render(stats) {
        if (!stats) {
            stats = calculator.calculateAll(character.getData());
        }

        const data = character.getData();

        // Portrait
        this.renderPortrait();

        // Basic info
        const nameInput = document.getElementById('charNameInput');
        if (nameInput) nameInput.value = data.name;

        const alignmentSelect = document.getElementById('charAlignment');
        if (alignmentSelect) alignmentSelect.value = data.alignment;

        this.setText('charRace', data.race);
        this.setText('charLevel', data.level);
        this.setText('charSize', data.size);

        // Class summary (e.g., "Fighter 3 / Wizard 2")
        const classLevels = {};
        data.classes.forEach(cl => {
            classLevels[cl.className] = (classLevels[cl.className] || 0) + 1;
        });
        const classSummary = Object.entries(classLevels).map(([name, lvl]) => `${name} ${lvl}`).join(' / ') || '-';
        this.setText('charClass', classSummary);

        // XP tracker
        const currentXP = data.inventory.experience || 0;
        const currentLevel = data.level;
        const currentLevelXP = calculator.calculateNextLevelXP(currentLevel - 1);
        const nextLevelXP = calculator.calculateNextLevelXP(currentLevel);
        const progress = currentLevel >= 20 ? 100 : ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100);
        const xpNeeded = Math.max(0, nextLevelXP - currentXP);

        const xpBar = document.getElementById('charXpBar');
        if (xpBar) xpBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        this.setText('charXpCurrent', `${currentXP.toLocaleString()} XP`);
        this.setText('charXpNext', currentLevel >= 20 ? 'Max Level' : `Next (${currentLevel + 1}): ${nextLevelXP.toLocaleString()} XP`);
        this.setText('charXpNeeded', currentLevel >= 20 ? 'Max level reached' : `${xpNeeded.toLocaleString()} XP needed`);
        const xpInput = document.getElementById('charXpInput');
        if (xpInput && document.activeElement !== xpInput) xpInput.value = currentXP;

        // Multiclass XP penalty
        const xpPenaltyEl = document.getElementById('charXpPenalty');
        if (xpPenaltyEl) {
            const xpPenalty = stats.multiclassXPPenalty;
            if (xpPenalty && xpPenalty.penalty > 0) {
                const pct = Math.round(xpPenalty.penalty * 100);
                xpPenaltyEl.textContent = `-${pct}% XP penalty (${xpPenalty.details.join('; ')})`;
                xpPenaltyEl.style.display = 'block';
            } else {
                xpPenaltyEl.style.display = 'none';
            }
        }

        // Abilities
        Object.entries(stats.abilities).forEach(([ability, values]) => {
            this.setText(`char${ability.toUpperCase()}Score`, values.score);
            this.setText(`char${ability.toUpperCase()}Mod`, values.modifier >= 0 ? `+${values.modifier}` : values.modifier);
        });

        // HP
        this.setText('charHP', stats.hp.total);
        this.setText('charCurrentHP', stats.hp.current);

        // AC
        this.setText('charACFull', stats.ac.full);
        this.setText('charACFlat', stats.ac.flatFooted);
        this.setText('charACTouch', stats.ac.touch);

        const acBreakdown = `10 base + ${stats.ac.components.armor} armor + ${stats.ac.components.shield} shield + ${stats.ac.components.dex} dex + ${stats.ac.components.size} size + ${stats.ac.components.natural} natural`;
        this.setText('acBreakdown', acBreakdown);

        // Saves
        ['fortitude', 'reflex', 'will'].forEach(save => {
            const saveData = stats.saves[save];
            const total = saveData.total;
            this.setText(`char${save.charAt(0).toUpperCase() + save.slice(1)}`, total >= 0 ? `+${total}` : total);
            this.setText(`${save}Breakdown`, `${saveData.base} base + ${saveData.ability} ability`);
        });

        // Attack bonuses
        this.setText('charBAB', `+${stats.bab}`);
        this.setText('charMelee', stats.attacks.melee.total >= 0 ? `+${stats.attacks.melee.total}` : stats.attacks.melee.total);
        this.setText('charRanged', stats.attacks.ranged.total >= 0 ? `+${stats.attacks.ranged.total}` : stats.attacks.ranged.total);
        this.setText('charGrapple', stats.attacks.grapple.total >= 0 ? `+${stats.attacks.grapple.total}` : stats.attacks.grapple.total);

        this.setText('meleeBreakdown', `${stats.bab} BAB + ${stats.attacks.melee.components.ability} STR`);
        this.setText('rangedBreakdown', `${stats.bab} BAB + ${stats.attacks.ranged.components.ability} DEX`);
        this.setText('grappleBreakdown', `${stats.bab} BAB + ${stats.attacks.grapple.components.ability} STR`);

        // Initiative
        this.setText('charInitiative', stats.initiative >= 0 ? `+${stats.initiative}` : stats.initiative);

        // Movement
        this.setText('charMoveLand', `${data.movement.land} ft.`);
        this.setText('charMoveClimb', data.movement.climb ? `${data.movement.climb} ft.` : '-');
        this.setText('charMoveSwim', data.movement.swim ? `${data.movement.swim} ft.` : '-');
        this.setText('charMoveFly', data.movement.fly ? `${data.movement.fly} ft.` : '-');

        // Combat Maneuvers
        this.renderCombatManeuvers(data, stats);

        // Languages
        this.renderLanguages();
    }

    renderCombatManeuvers(data, stats) {
        const hasPowerAttack = data.feats && data.feats.some(f => f.name === 'Power Attack');
        const hasCombatExpertise = data.feats && data.feats.some(f => f.name === 'Combat Expertise');

        const combatManeuversCard = document.getElementById('combatManeuversCard');
        const powerAttackControl = document.getElementById('powerAttackControl');
        const combatExpertiseControl = document.getElementById('combatExpertiseControl');

        // Show card if character has either feat
        if (hasPowerAttack || hasCombatExpertise) {
            if (combatManeuversCard) combatManeuversCard.style.display = 'block';

            const maxBAB = stats.bab;

            // Power Attack
            if (hasPowerAttack && powerAttackControl) {
                powerAttackControl.style.display = 'block';

                const powerAttackSlider = document.getElementById('powerAttackSlider');
                const powerAttackInput = document.getElementById('powerAttackInput');
                const currentValue = data.combat.activatedFeats?.powerAttack || 0;

                if (powerAttackSlider && powerAttackInput) {
                    powerAttackSlider.max = maxBAB;
                    powerAttackSlider.value = currentValue;
                    powerAttackInput.max = maxBAB;
                    powerAttackInput.value = currentValue;

                    // Update effect display
                    document.getElementById('powerAttackValue').textContent = currentValue;
                    const damageBonus = currentValue;
                    const twoHandedDamage = currentValue * 2;
                    document.getElementById('powerAttackEffect').innerHTML =
                        `<span class="effect-negative">-${currentValue} Attack</span> → <span class="effect-positive">+${damageBonus} Damage (one-handed) / +${twoHandedDamage} (two-handed)</span>`;
                }
            } else if (powerAttackControl) {
                powerAttackControl.style.display = 'none';
            }

            // Combat Expertise
            if (hasCombatExpertise && combatExpertiseControl) {
                combatExpertiseControl.style.display = 'block';

                const combatExpertiseSlider = document.getElementById('combatExpertiseSlider');
                const combatExpertiseInput = document.getElementById('combatExpertiseInput');
                const currentValue = data.combat.activatedFeats?.combatExpertise || 0;

                if (combatExpertiseSlider && combatExpertiseInput) {
                    combatExpertiseSlider.max = maxBAB;
                    combatExpertiseSlider.value = currentValue;
                    combatExpertiseInput.max = maxBAB;
                    combatExpertiseInput.value = currentValue;

                    // Update effect display
                    document.getElementById('combatExpertiseValue').textContent = currentValue;
                    document.getElementById('combatExpertiseEffect').innerHTML =
                        `<span class="effect-negative">-${currentValue} Attack</span> → <span class="effect-positive">+${currentValue} AC</span>`;
                }
            } else if (combatExpertiseControl) {
                combatExpertiseControl.style.display = 'none';
            }
        } else if (combatManeuversCard) {
            combatManeuversCard.style.display = 'none';
        }
    }

    renderLanguages() {
        try {
            const data = character.getData();
            const languages = character.getLanguages();
            const bonusLanguageCount = character.getBonusLanguageCount();
            const racialLanguages = character.getRacialLanguages();

            // Populate datalist with language options
            const datalist = document.getElementById('languageDatalist');
            if (datalist && dataLoader.gameData.languages) {
                datalist.innerHTML = Array.from(dataLoader.gameData.languages.values())
                    .sort((a, b) => {
                        // Sort: Common first, then Standard, then Exotic
                        if (a.name === 'Common') return -1;
                        if (b.name === 'Common') return 1;
                        if (a.type !== b.type) {
                            const order = { 'Standard': 0, 'Exotic': 1, 'Secret': 2 };
                            return (order[a.type] || 3) - (order[b.type] || 3);
                        }
                        return a.name.localeCompare(b.name);
                    })
                    .map(lang => {
                        const typeLabel = lang.type === 'Standard' ? '' : ` (${lang.type})`;
                        return `<option value="${lang.name}">${lang.name}${typeLabel} - ${lang.typicalSpeakers}</option>`;
                    })
                    .join('');
            }

            // Calculate language counts (excluding free languages like Common)
            const freeLanguages = languages.filter(lang => lang === 'Common');
            const countedLanguages = languages.filter(lang => lang !== 'Common');
            const bonusLanguagesUsed = Math.max(0, countedLanguages.length - racialLanguages.filter(l => l !== 'Common').length);
            const bonusLanguagesRemaining = bonusLanguageCount - bonusLanguagesUsed;
            const atLimit = bonusLanguagesRemaining <= 0;

            // Update summary
            const summaryDiv = document.getElementById('languagesSummary');
            if (summaryDiv) {
                const racialCount = racialLanguages.filter(l => l !== 'Common' && countedLanguages.includes(l)).length;
                summaryDiv.innerHTML = `
                    You know <strong>${languages.length}</strong> language${languages.length !== 1 ? 's' : ''}
                    ${freeLanguages.length > 0 ? `(${freeLanguages.length} free, ` : '('}${racialCount} racial, ${bonusLanguagesUsed} from INT)
                    ${bonusLanguagesRemaining > 0 ?
                        `<span style="color: #28a745;"> - ${bonusLanguagesRemaining} bonus language${bonusLanguagesRemaining !== 1 ? 's' : ''} available!</span>` :
                        `<span style="color: #dc3545;"> - At language limit (INT modifier: +${bonusLanguageCount})</span>`
                    }
                `;
            }

            // Enable/disable add button based on limit
            const addBtn = document.getElementById('addLanguageBtn');
            const addInput = document.getElementById('addLanguageInput');
            if (addBtn && addInput) {
                if (atLimit) {
                    addBtn.disabled = true;
                    addBtn.title = 'You have reached your language limit. Remove a language or increase Intelligence.';
                    addInput.disabled = true;
                    addInput.placeholder = 'At language limit (increase INT for more)';
                } else {
                    addBtn.disabled = false;
                    addBtn.title = '';
                    addInput.disabled = false;
                    addInput.placeholder = 'Select or type language name';
                }
            }

            // Render language tags
            const listDiv = document.getElementById('languagesList');
            if (listDiv) {
                if (languages.length === 0) {
                    listDiv.innerHTML = '<p class="info-text">No languages known yet. Common is free for all characters!</p>';
                } else {
                    listDiv.innerHTML = languages.map(lang => {
                        const isRacial = racialLanguages.includes(lang);
                        const isFree = lang === 'Common';
                        const tagClass = isFree ? 'free-language' : (isRacial ? '' : 'bonus-language');
                        const langData = dataLoader.gameData.languages?.get(lang);
                        const tooltip = langData ? langData.description : '';

                        return `
                            <span class="language-tag ${tagClass}" title="${tooltip}">
                                ${lang}
                                ${isFree ? '<span style="font-size: 0.8em;" title="Free for all">🆓</span>' : ''}
                                ${isRacial && !isFree ? '<span style="font-size: 0.8em;" title="Racial language">👤</span>' : ''}
                                <button class="remove-language-btn" data-language="${lang}" title="Remove language">×</button>
                            </span>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error('Error rendering languages:', error);
            const summaryDiv = document.getElementById('languagesSummary');
            if (summaryDiv) {
                summaryDiv.innerHTML = '<p class="info-text" style="color: #dc3545;">Error loading languages. Please refresh the page.</p>';
            }
        }
    }

    // Process an image file into a portrait
    processPortraitFile(file) {
        if (!file.type.startsWith('image/')) {
            if (window.InfoModal) InfoModal.toast('Please select an image file.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize to max 600x800 (3:4 ratio max)
                const maxW = 600;
                const maxH = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxW || height > maxH) {
                    const scaleW = maxW / width;
                    const scaleH = maxH / height;
                    const scale = Math.min(scaleW, scaleH);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
                character.updateBasicInfo('portrait', dataUrl);
                this.renderPortrait();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    openLightbox() {
        const data = character.getData();
        if (!data.portrait) return;
        const lightbox = document.getElementById('portraitLightbox');
        const lightboxImg = document.getElementById('portraitLightboxImg');
        if (lightbox && lightboxImg) {
            lightboxImg.src = data.portrait;
            lightbox.classList.add('active');
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('portraitLightbox');
        if (lightbox) lightbox.classList.remove('active');
    }

    renderPortrait() {
        const data = character.getData();
        const portraitImage = document.getElementById('portraitImage');
        const portraitPlaceholder = document.getElementById('portraitPlaceholder');
        const portraitControls = document.getElementById('portraitControls');
        const portraitFrame = document.getElementById('portraitFrame');

        const hasPortrait = !!data.portrait;

        if (portraitImage) {
            portraitImage.src = hasPortrait ? data.portrait : '';
            portraitImage.style.display = hasPortrait ? 'block' : 'none';
        }
        if (portraitPlaceholder) portraitPlaceholder.style.display = hasPortrait ? 'none' : 'flex';
        if (portraitControls) portraitControls.style.display = hasPortrait ? 'flex' : 'none';
        if (portraitFrame) {
            portraitFrame.style.cursor = hasPortrait ? 'pointer' : 'pointer';
            portraitFrame.title = hasPortrait ? 'Click to view full size' : 'Click to browse or drag an image here';
        }
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

window.CharacterTab = CharacterTab;

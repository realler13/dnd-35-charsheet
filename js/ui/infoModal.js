// infoModal.js - Reusable modal/toast/confirmation system

class InfoModal {
    static _toastContainer = null;
    static _activeModal = null;
    static _escHandler = null;

    // ========== TOAST NOTIFICATIONS ==========

    static _ensureToastContainer() {
        if (!InfoModal._toastContainer) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            InfoModal._toastContainer = container;
        }
        return InfoModal._toastContainer;
    }

    static toast(message, type = 'info', duration = 3000) {
        const container = InfoModal._ensureToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const icons = {
            success: '\u2714',
            error: '\u2716',
            warning: '\u26A0',
            info: '\u2139'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">\u00D7</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => InfoModal._dismissToast(toast));

        container.appendChild(toast);

        // Trigger slide-in animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => InfoModal._dismissToast(toast), duration);
        }

        return toast;
    }

    static _dismissToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-dismissing');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, { once: true });
        // Fallback removal if transition doesn't fire
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }

    // ========== CONFIRMATION DIALOG ==========

    static async confirm(message, title = 'Confirm', options = {}) {
        const {
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            danger = false
        } = options;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'info-modal-overlay';

            overlay.innerHTML = `
                <div class="confirmation-modal">
                    <h3 class="confirmation-title">${title}</h3>
                    <p class="confirmation-message">${message}</p>
                    <div class="confirmation-actions">
                        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} confirmation-confirm">${confirmText}</button>
                        <button class="btn btn-secondary confirmation-cancel">${cancelText}</button>
                    </div>
                </div>
            `;

            const cleanup = (result) => {
                InfoModal._removeEscHandler();
                if (overlay.parentNode) {
                    overlay.classList.add('info-modal-closing');
                    overlay.addEventListener('animationend', () => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, { once: true });
                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    }, 300);
                }
                if (InfoModal._activeModal === overlay) {
                    InfoModal._activeModal = null;
                }
                resolve(result);
            };

            overlay.querySelector('.confirmation-confirm').addEventListener('click', () => cleanup(true));
            overlay.querySelector('.confirmation-cancel').addEventListener('click', () => cleanup(false));

            // Click on backdrop to cancel
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup(false);
            });

            document.body.appendChild(overlay);
            InfoModal._activeModal = overlay;
            InfoModal._setupEscHandler(() => cleanup(false));

            // Focus confirm button
            overlay.querySelector('.confirmation-confirm').focus();
        });
    }

    // ========== DETAIL MODAL ==========

    static showDetail(config) {
        const { title, subtitle, sections = [], tags = [] } = config;

        InfoModal.close();

        const overlay = document.createElement('div');
        overlay.className = 'info-modal-overlay';

        let tagsHTML = '';
        if (tags.length > 0) {
            tagsHTML = '<div class="info-modal-tags">' +
                tags.map(tag => `<span class="info-modal-tag" style="--tag-color: ${tag.color || 'var(--accent)'}">${tag.text}</span>`).join('') +
                '</div>';
        }

        let sectionsHTML = sections.map(section => {
            if (!section.content && section.content !== 0) return '';
            const typeClass = section.type ? `info-modal-section-${section.type}` : '';
            return `
                <div class="info-modal-section ${typeClass}">
                    <div class="info-modal-section-label">${section.label}</div>
                    <div class="info-modal-section-content">${section.content}</div>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="info-modal-detail">
                <button class="info-modal-close-btn">\u00D7</button>
                <h2 class="info-modal-title">${title}</h2>
                ${subtitle ? `<p class="info-modal-subtitle">${subtitle}</p>` : ''}
                ${tagsHTML}
                <div class="info-modal-sections">
                    ${sectionsHTML}
                </div>
            </div>
        `;

        const cleanup = () => {
            InfoModal._removeEscHandler();
            if (overlay.parentNode) {
                overlay.classList.add('info-modal-closing');
                overlay.addEventListener('animationend', () => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, { once: true });
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 300);
            }
            if (InfoModal._activeModal === overlay) {
                InfoModal._activeModal = null;
            }
        };

        overlay.querySelector('.info-modal-close-btn').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        document.body.appendChild(overlay);
        InfoModal._activeModal = overlay;
        InfoModal._setupEscHandler(cleanup);
    }

    // ========== CHARACTER LOAD MODAL ==========

    static showCharacterLoadModal(characterList, onLoad, onDelete) {
        InfoModal.close();

        const overlay = document.createElement('div');
        overlay.className = 'info-modal-overlay';

        const renderCards = () => {
            const currentList = characterStorage.getCharacterList();
            if (currentList.length === 0) {
                cleanup();
                InfoModal.toast('No saved characters found.', 'info');
                return;
            }

            const cardsHTML = currentList.map(name => {
                // Try to load character data for preview
                let previewHTML = '';
                try {
                    const key = characterStorage.storagePrefix + name;
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const saveData = JSON.parse(raw);
                        const data = saveData.data;
                        const savedAt = saveData.savedAt ? new Date(saveData.savedAt).toLocaleDateString() : 'Unknown';

                        const race = data.race || 'Unknown Race';
                        const level = data.level || 1;

                        // Get class summary
                        let classStr = 'No class';
                        if (data.classes && data.classes.length > 0) {
                            const classCounts = {};
                            data.classes.forEach(c => {
                                const cls = c.className || c;
                                classCounts[cls] = (classCounts[cls] || 0) + 1;
                            });
                            classStr = Object.entries(classCounts)
                                .map(([cls, lvl]) => `${cls} ${lvl}`)
                                .join(' / ');
                        }

                        previewHTML = `
                            <div class="character-load-preview">
                                <span class="character-load-race">${race}</span>
                                <span class="character-load-classes">${classStr}</span>
                                <span class="character-load-level">Level ${level}</span>
                                <span class="character-load-date">Saved: ${savedAt}</span>
                            </div>
                        `;
                    }
                } catch (e) {
                    // Ignore preview errors
                }

                return `
                    <div class="character-load-card" data-name="${name}">
                        <div class="character-load-info">
                            <h3 class="character-load-name">${name}</h3>
                            ${previewHTML}
                        </div>
                        <div class="character-load-actions">
                            <button class="btn btn-primary btn-small character-load-btn" data-name="${name}">Load</button>
                            <button class="btn btn-danger btn-small character-delete-btn" data-name="${name}">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');

            const container = overlay.querySelector('.character-load-list');
            if (container) {
                container.innerHTML = cardsHTML;
            }
        };

        overlay.innerHTML = `
            <div class="info-modal-detail" style="max-width: 550px;">
                <button class="info-modal-close-btn">\u00D7</button>
                <h2 class="info-modal-title">Load Character</h2>
                <div class="character-load-list"></div>
            </div>
        `;

        const cleanup = () => {
            InfoModal._removeEscHandler();
            if (overlay.parentNode) {
                overlay.classList.add('info-modal-closing');
                overlay.addEventListener('animationend', () => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, { once: true });
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 300);
            }
            if (InfoModal._activeModal === overlay) {
                InfoModal._activeModal = null;
            }
        };

        overlay.querySelector('.info-modal-close-btn').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });

        // Delegate click events for load/delete
        overlay.addEventListener('click', async (e) => {
            const loadBtn = e.target.closest('.character-load-btn');
            const deleteBtn = e.target.closest('.character-delete-btn');

            if (loadBtn) {
                const name = loadBtn.dataset.name;
                cleanup();
                if (onLoad) onLoad(name);
            } else if (deleteBtn) {
                const name = deleteBtn.dataset.name;
                const confirmed = await InfoModal.confirm(
                    `Are you sure you want to delete "${name}"? This cannot be undone.`,
                    'Delete Character',
                    { confirmText: 'Delete', danger: true }
                );
                if (confirmed) {
                    if (onDelete) onDelete(name);
                    renderCards();
                }
            }
        });

        document.body.appendChild(overlay);
        InfoModal._activeModal = overlay;
        InfoModal._setupEscHandler(cleanup);

        renderCards();
    }

    // ========== CLOSE ==========

    static close() {
        if (InfoModal._activeModal && InfoModal._activeModal.parentNode) {
            InfoModal._activeModal.parentNode.removeChild(InfoModal._activeModal);
            InfoModal._activeModal = null;
        }
        InfoModal._removeEscHandler();
    }

    // ========== ESCAPE KEY HANDLING ==========

    static _setupEscHandler(callback) {
        InfoModal._removeEscHandler();
        InfoModal._escHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                callback();
            }
        };
        document.addEventListener('keydown', InfoModal._escHandler, true);
    }

    static _removeEscHandler() {
        if (InfoModal._escHandler) {
            document.removeEventListener('keydown', InfoModal._escHandler, true);
            InfoModal._escHandler = null;
        }
    }
}

// ========== DETAIL VIEW HELPERS ==========

function showFeatDetail(featName, characterData, stats) {
    const featData = dataLoader.gameData.feats.get(featName);
    if (!featData) {
        InfoModal.toast(`Feat "${featName}" not found in database.`, 'warning');
        return;
    }

    // Get current feat choice if character has this feat
    let featChoice = null;
    if (characterData && characterData.feats) {
        const charFeat = characterData.feats.find(f => f.name === featName);
        if (charFeat) featChoice = charFeat.choice;
    }

    const parsed = parseFeatBenefits(featData, featChoice);
    const mechanicalSummary = getFeatMechanicalSummary(featData, featChoice);

    // Build tags
    const tags = [];
    tags.push({ text: featData.type || 'General', color: 'var(--accent)' });
    if (featData.source) {
        tags.push({ text: featData.source, color: 'var(--parchment-dim)' });
    }
    // Category tag
    const categoryColors = {
        automatic: 'var(--positive)',
        manual: 'var(--warning)',
        informational: 'var(--accent)',
        metamagic: '#c084fc',
        special_ui: '#f472b6'
    };
    if (parsed.category) {
        tags.push({ text: parsed.category.replace('_', ' '), color: categoryColors[parsed.category] || 'var(--text-muted)' });
    }

    // Build prerequisite section with met/unmet indicators
    let prereqContent = 'None';
    if (featData.prerequisite) {
        prereqContent = featData.prerequisite;
        if (characterData && stats) {
            try {
                const prereqCheck = calculator.checkFeatPrerequisites(characterData, featData, stats.abilities);
                if (prereqCheck.qualifies) {
                    prereqContent += '<div style="margin-top: 8px; color: var(--positive); font-weight: 600;">All prerequisites met</div>';
                } else {
                    prereqContent += '<div style="margin-top: 8px; color: var(--danger); font-weight: 600;">Missing: ' + prereqCheck.missing.join(', ') + '</div>';
                }
            } catch (e) {
                // Ignore prerequisite check errors
            }
        }
    }

    // Build sections
    const sections = [];

    if (featData.prerequisite) {
        sections.push({ label: 'Prerequisites', content: prereqContent });
    }

    const benefit = (featData.benefit || '').replace(/<[^>]*>/g, '').trim();
    if (benefit) {
        sections.push({ label: 'Benefit', content: benefit });
    }

    if (mechanicalSummary && mechanicalSummary !== 'No automatic bonuses') {
        sections.push({ label: 'Mechanical Effects', content: mechanicalSummary, type: 'highlight' });
    }

    if (featData.normal) {
        const normal = featData.normal.replace(/<[^>]*>/g, '').trim();
        sections.push({ label: 'Normal', content: normal });
    }

    if (featData.special) {
        const special = featData.special.replace(/<[^>]*>/g, '').trim();
        sections.push({ label: 'Special', content: special });
    }

    const displayName = featChoice ? `${featName} (${featChoice})` : featName;
    InfoModal.showDetail({
        title: displayName,
        subtitle: parsed.description,
        tags: tags,
        sections: sections
    });
}

function showSpellDetail(spellName) {
    const spellData = dataLoader.gameData.spells.get(spellName);
    if (!spellData) {
        InfoModal.toast(`Spell "${spellName}" not found in database.`, 'warning');
        return;
    }

    // Build tags
    const tags = [];
    if (spellData.school) {
        const schoolColors = {
            Abjuration: '#6ea8fe',
            Conjuration: '#ffda6a',
            Divination: '#a3cfbb',
            Enchantment: '#e685b5',
            Evocation: '#ea868f',
            Illusion: '#c29ffa',
            Necromancy: '#adb5bd',
            Transmutation: '#79dfc1'
        };
        tags.push({ text: spellData.school, color: schoolColors[spellData.school] || 'var(--accent)' });
    }
    if (spellData.subschool) {
        tags.push({ text: spellData.subschool, color: 'var(--parchment-dim)' });
    }

    // Class/level matrix
    let levelContent = 'Not available';
    if (spellData.levels && Object.keys(spellData.levels).length > 0) {
        levelContent = Object.entries(spellData.levels)
            .map(([cls, lvl]) => `<strong>${cls}</strong> ${lvl}`)
            .join(', ');
    }

    // Build sections
    const sections = [];

    sections.push({ label: 'Class/Level', content: levelContent });

    if (spellData.components) {
        sections.push({ label: 'Components', content: spellData.components });
    }
    if (spellData.castingTime) {
        sections.push({ label: 'Casting Time', content: spellData.castingTime });
    }
    if (spellData.range) {
        sections.push({ label: 'Range', content: spellData.range });
    }
    if (spellData.duration) {
        sections.push({ label: 'Duration', content: spellData.duration });
    }
    if (spellData.savingThrow) {
        sections.push({ label: 'Saving Throw', content: spellData.savingThrow });
    }
    if (spellData.spellResistance) {
        sections.push({ label: 'Spell Resistance', content: spellData.spellResistance });
    }

    const description = spellData.description
        ? spellData.description.replace(/<[^>]*>/g, '').trim()
        : (spellData.fullText ? spellData.fullText.replace(/<[^>]*>/g, '').trim() : '');

    if (description) {
        sections.push({ label: 'Description', content: description });
    }

    InfoModal.showDetail({
        title: spellData.name,
        subtitle: spellData.school ? `${spellData.school} spell` : null,
        tags: tags,
        sections: sections
    });
}

window.InfoModal = InfoModal;
window.showFeatDetail = showFeatDetail;
window.showSpellDetail = showSpellDetail;

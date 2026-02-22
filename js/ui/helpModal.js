// helpModal.js - In-app help documentation system

class HelpModal {
    static _overlay = null;

    static show() {
        // Close any existing help modal
        HelpModal.close();

        const overlay = document.createElement('div');
        overlay.className = 'info-modal-overlay';

        const sections = HelpModal._getSections();

        const tocHTML = sections.map((s, i) =>
            `<a class="help-toc-link${i === 0 ? ' active' : ''}" data-section="${i}">${s.title}</a>`
        ).join('');

        const contentHTML = sections.map((s, i) =>
            `<div class="help-section" id="help-section-${i}">
                <h3 class="help-section-title">${s.title}</h3>
                <div class="help-section-body">${s.body}</div>
            </div>`
        ).join('');

        overlay.innerHTML = `
            <div class="help-modal">
                <button class="info-modal-close-btn">&times;</button>
                <h2 class="info-modal-title">Help &amp; Documentation</h2>
                <div class="help-layout">
                    <nav class="help-sidebar">
                        ${tocHTML}
                    </nav>
                    <div class="help-body">
                        ${contentHTML}
                    </div>
                </div>
            </div>
        `;

        // Wire up close
        const cleanup = () => {
            if (overlay.parentNode) {
                overlay.classList.add('info-modal-closing');
                overlay.addEventListener('animationend', () => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, { once: true });
                setTimeout(() => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }, 300);
            }
            HelpModal._overlay = null;
            document.removeEventListener('keydown', escHandler);
        };

        const escHandler = (e) => {
            if (e.key === 'Escape') cleanup();
        };

        overlay.querySelector('.info-modal-close-btn').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
        document.addEventListener('keydown', escHandler);

        // Wire up TOC navigation
        const helpBody = overlay.querySelector('.help-body');
        const tocLinks = overlay.querySelectorAll('.help-toc-link');

        tocLinks.forEach(link => {
            link.addEventListener('click', () => {
                const idx = link.dataset.section;
                const target = overlay.querySelector(`#help-section-${idx}`);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                tocLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Update active TOC link on scroll
        helpBody.addEventListener('scroll', () => {
            const sectionEls = overlay.querySelectorAll('.help-section');
            let current = 0;
            sectionEls.forEach((el, i) => {
                if (el.offsetTop - helpBody.offsetTop <= helpBody.scrollTop + 40) {
                    current = i;
                }
            });
            tocLinks.forEach(l => l.classList.remove('active'));
            tocLinks[current]?.classList.add('active');
        });

        document.body.appendChild(overlay);
        HelpModal._overlay = overlay;
    }

    static close() {
        if (HelpModal._overlay && HelpModal._overlay.parentNode) {
            HelpModal._overlay.parentNode.removeChild(HelpModal._overlay);
            HelpModal._overlay = null;
        }
    }

    static _getSections() {
        return [
            {
                title: 'Getting Started',
                body: `
                    <p>Welcome to the <strong>3.5 Character Sheet</strong>! Here's how to create your first character:</p>
                    <ol>
                        <li><strong>Pick a race</strong> on the <em>Abilities</em> tab &mdash; racial bonuses and languages are applied automatically.</li>
                        <li><strong>Add class levels</strong> on the <em>Classes</em> tab &mdash; choose your class, roll or assign HP, and pick specializations if available.</li>
                        <li><strong>Set ability scores</strong> on the <em>Abilities</em> tab &mdash; enter your base scores and any magic/misc/temp modifiers.</li>
                        <li><strong>Allocate skill points</strong> on the <em>Skills</em> tab &mdash; class skills cost 1 point, cross-class skills cost 2.</li>
                        <li><strong>Choose feats</strong> on the <em>Feats</em> tab &mdash; browse the full library, check prerequisites, and add feats to your character.</li>
                        <li><strong>Save your character</strong> using the <em>Save</em> button in the header. Characters are stored in your browser (or app) and auto-saved every 5 seconds.</li>
                    </ol>
                    <div class="help-tip">Your character auto-saves 5 seconds after any change, but it's good practice to hit Save manually before closing.</div>
                `
            },
            {
                title: 'Character Management',
                body: `
                    <p>The header buttons handle all character lifecycle operations:</p>
                    <ul>
                        <li><strong>New</strong> &mdash; Create a blank character. You'll be asked to confirm (unsaved changes are lost).</li>
                        <li><strong>Load</strong> &mdash; Open a saved character from the list. You can also delete saved characters from this dialog.</li>
                        <li><strong>Save</strong> &mdash; Save the current character to local storage. The character name (set in the Character tab) is used as the save name.</li>
                        <li><strong>Export</strong> &mdash; Download the character as a <code>.zip</code> file containing the character data and portrait image. Great for backups or sharing with other players.</li>
                        <li><strong>Import</strong> &mdash; Load a character from a <code>.zip</code> or legacy <code>.json</code> file. Replaces the current character.</li>
                        <li><strong>Print / PDF</strong> &mdash; Opens a print-optimized layout. Use your browser's "Save as PDF" option to create a PDF.</li>
                    </ul>
                    <div class="help-tip">Export your characters regularly as backups &mdash; browser storage can be cleared by OS updates or browser cleanup.</div>
                `
            },
            {
                title: 'Character Tab',
                body: `
                    <p>The Character tab is your at-a-glance overview. It shows:</p>
                    <ul>
                        <li><strong>Character portrait</strong> &mdash; displayed to the right of the character info. Drag &amp; drop an image onto the frame, or click the empty frame to browse for an image file. Click the portrait to view it full-size. Hover over the portrait to see change/remove buttons. The portrait is saved with your character and included in ZIP exports.</li>
                        <li><strong>Character name</strong> &mdash; editable, used as the save file name.</li>
                        <li><strong>Alignment</strong> &mdash; dropdown selector for the nine standard alignments.</li>
                        <li><strong>Race, classes, and level</strong> &mdash; read-only summary of your build.</li>
                        <li><strong>Ability scores &amp; modifiers</strong> &mdash; computed from base + racial + magic + misc + temp.</li>
                        <li><strong>Saving throws</strong> &mdash; base (from class) + ability mod + magic + misc + feat bonuses.</li>
                        <li><strong>AC breakdown</strong> &mdash; base 10 + armor + shield + DEX + size + natural + deflection + misc. You can edit the misc modifier directly.</li>
                        <li><strong>HP tracking</strong> &mdash; current/max HP, wounds, subdual damage, and nonlethal status.</li>
                        <li><strong>Attack bonuses</strong> &mdash; BAB, melee, ranged, CMB (with iterative attacks).</li>
                    </ul>
                `
            },
            {
                title: 'Abilities Tab',
                body: `
                    <p>Configure your character's six ability scores and race:</p>
                    <ul>
                        <li><strong>Race selection</strong> &mdash; choose from 49 races. Racial ability modifiers, size, speed, and racial languages are applied automatically.</li>
                        <li><strong>Base scores</strong> &mdash; enter your rolled or point-buy ability scores (STR, DEX, CON, INT, WIS, CHA).</li>
                        <li><strong>Level-up increases</strong> &mdash; at levels 4, 8, 12, 16, and 20 you get +1 to an ability. Select which ability gets each increase.</li>
                        <li><strong>Magic modifiers</strong> &mdash; bonuses from magic items (e.g., Belt of Giant Strength).</li>
                        <li><strong>Misc modifiers</strong> &mdash; any other permanent bonuses not covered above.</li>
                        <li><strong>Temp modifiers</strong> &mdash; temporary effects (spells, conditions) &mdash; these don't affect permanent calculations like skill points.</li>
                    </ul>
                    <div class="help-tip">Click on any ability score total to see a full breakdown of where each bonus comes from.</div>
                `
            },
            {
                title: 'Classes Tab',
                body: `
                    <p>Manage your class levels, HP, and multiclassing:</p>
                    <ul>
                        <li><strong>Adding levels</strong> &mdash; select a class from the dropdown and click "Add Level". You'll be prompted for an HP roll.</li>
                        <li><strong>Multiclassing</strong> &mdash; add levels in different classes to multiclass. BAB, saves, and skill points are calculated per-class.</li>
                        <li><strong>HP per level</strong> &mdash; each level tracks its own HP roll. You can edit HP values after the fact.</li>
                        <li><strong>Specializations</strong> &mdash; some classes (Wizard, Cleric, etc.) offer specializations that affect spell lists or grant bonus feats.</li>
                        <li><strong>Class skill points</strong> &mdash; each class grants a set number of skill points per level, modified by INT.</li>
                    </ul>
                    <div class="help-tip">First level always gets maximum HP for the class hit die &mdash; no need to roll.</div>
                `
            },
            {
                title: 'Skills Tab',
                body: `
                    <p>Allocate and track your character's skills:</p>
                    <ul>
                        <li><strong>Skill points per level</strong> &mdash; determined by class + INT modifier. Shown at the top of the tab.</li>
                        <li><strong>Class vs. cross-class</strong> &mdash; class skills cost 1 point per rank. Cross-class skills cost 2 points per rank. Class skills are highlighted.</li>
                        <li><strong>Maximum ranks</strong> &mdash; class skills max at character level + 3. Cross-class skills max at half that.</li>
                        <li><strong>Search &amp; filter</strong> &mdash; use the search box to quickly find skills. Filter by class skills only.</li>
                        <li><strong>Skill Focus</strong> &mdash; if you have the Skill Focus feat, the +3 bonus is automatically applied to the chosen skill.</li>
                        <li><strong>Synergy bonuses</strong> &mdash; some skills provide +2 synergy bonuses to related skills at 5+ ranks.</li>
                    </ul>
                `
            },
            {
                title: 'Feats Tab',
                body: `
                    <p>Browse, search, and manage over <strong>3,400 feats</strong>:</p>
                    <ul>
                        <li><strong>Browsing</strong> &mdash; feats are listed with name, type, prerequisites, and benefit text. Use search and category filters to narrow down.</li>
                        <li><strong>Prerequisites</strong> &mdash; prerequisites are checked against your current character. Unmet prerequisites are flagged but don't prevent adding (your DM might allow it).</li>
                        <li><strong>Choice feats</strong> &mdash; some feats require a choice when added: Skill Focus (pick a skill), Weapon Focus (pick a weapon), Spell Focus (pick a school), etc.</li>
                        <li><strong>Automatic bonuses</strong> &mdash; many feats are auto-parsed for mechanical bonuses. Feats like Great Fortitude (+2 Fort), Lightning Reflexes (+2 Ref), Iron Will (+2 Will), and Toughness (+3 HP) are automatically applied to your character sheet.</li>
                        <li><strong>Flaws</strong> &mdash; you can take up to 2 flaws (penalties to saves, AC, attacks, etc.). Each flaw grants one bonus feat. Flaw penalties are automatically applied.</li>
                    </ul>
                    <div class="help-tip">Click on any feat name to see its full description, including benefit text, prerequisites, and source book.</div>
                `
            },
            {
                title: 'Inventory Tab',
                body: `
                    <p>Track your gear, wealth, and magic items:</p>
                    <ul>
                        <li><strong>Coins</strong> &mdash; track Platinum (PP), Gold (GP), Silver (SP), and Copper (CP) separately. Total wealth is shown in GP equivalent.</li>
                        <li><strong>XP tracking</strong> &mdash; enter current XP. The tab shows progress toward the next level.</li>
                        <li><strong>Carrying capacity</strong> &mdash; calculated from STR score. Shows light/medium/heavy load thresholds and current encumbrance status.</li>
                        <li><strong>Magic item slots</strong> &mdash; 13 equipment slots (head, face, throat, shoulders, body, torso, waist, hands, arms, feet, ring ×2, held). Drag items to equip.</li>
                        <li><strong>Item database</strong> &mdash; browse and search <strong>2,800+ items</strong> from the 3.5 SRD. Add items directly to your inventory.</li>
                        <li><strong>Custom items</strong> &mdash; create custom items with name, weight, cost, and description.</li>
                    </ul>
                `
            },
            {
                title: 'Spells Tab',
                body: `
                    <p>Manage spellcasting, spell slots, and a library of <strong>4,600+ spells</strong>:</p>
                    <ul>
                        <li><strong>Caster configuration</strong> &mdash; set your caster level and casting ability (INT for Wizards, WIS for Clerics/Druids, CHA for Sorcerers/Bards).</li>
                        <li><strong>Spell slots per day</strong> &mdash; auto-calculated from class progression tables plus bonus spells from high casting ability.</li>
                        <li><strong>Spell database</strong> &mdash; search and filter the full spell list by class, level, school, and name.</li>
                        <li><strong>Prepared spells</strong> &mdash; add spells to your prepared list. Prepared spells show save DC and other relevant info.</li>
                        <li><strong>Cast &amp; reset</strong> &mdash; track spell slot usage throughout the adventuring day. Use "Reset" to restore all slots after a long rest.</li>
                        <li><strong>Spell DCs</strong> &mdash; save DCs are calculated as 10 + spell level + casting ability modifier (+ Spell Focus if applicable).</li>
                    </ul>
                `
            },
            {
                title: 'Game Log',
                body: `
                    <p>Keep a session-by-session record of your adventures:</p>
                    <ul>
                        <li><strong>Manual entries</strong> &mdash; add timestamped log entries with free-text notes.</li>
                        <li><strong>Auto-logging</strong> &mdash; wealth changes (gold gained/spent) and XP awards are automatically logged with amounts.</li>
                        <li><strong>Type filtering</strong> &mdash; filter log entries by type (manual, wealth, XP) to find specific records.</li>
                        <li><strong>Search</strong> &mdash; full-text search across all log entries.</li>
                    </ul>
                    <div class="help-tip">Use the game log to track loot distribution, quest rewards, and session summaries for your group.</div>
                `
            },
            {
                title: 'Themes',
                body: `
                    <p>The app supports two visual themes:</p>
                    <ul>
                        <li><strong>Dark theme</strong> (default) &mdash; a dark fantasy "grimoire" aesthetic with warm gold accents on deep purple-black backgrounds.</li>
                        <li><strong>Light theme</strong> &mdash; a warm parchment/scholar's study look with sepia tones and brown accents.</li>
                    </ul>
                    <p>Toggle between themes using the <strong>sun/moon button</strong> in the top-right corner of the header. Your preference is saved and persists across sessions.</p>
                `
            },
            {
                title: 'Keyboard Shortcuts',
                body: `
                    <ul>
                        <li><kbd class="help-kbd">Esc</kbd> &mdash; Close any open modal or dialog.</li>
                        <li><kbd class="help-kbd">Tab</kbd> &mdash; Move between input fields within a tab.</li>
                        <li><kbd class="help-kbd">Enter</kbd> &mdash; Submit forms and confirm dialogs.</li>
                    </ul>
                `
            },
            {
                title: 'Tips & Tricks',
                body: `
                    <ul>
                        <li><strong>Feat auto-bonuses</strong> &mdash; feats like Great Fortitude, Lightning Reflexes, Iron Will, Toughness, Improved Initiative, and many more are automatically parsed and applied. You don't need to manually adjust your saves or HP.</li>
                        <li><strong>Power Attack &amp; Combat Expertise</strong> &mdash; these feats provide interactive sliders on the Character tab, letting you trade attack bonus for damage (or AC) on the fly.</li>
                        <li><strong>Encumbrance</strong> &mdash; keep an eye on your carrying capacity. The Inventory tab shows your load status and warns when you're over your light load threshold.</li>
                        <li><strong>Multiclass skill costs</strong> &mdash; when multiclassing, a skill is class-skill if <em>any</em> of your classes has it as a class skill.</li>
                        <li><strong>Portraits</strong> &mdash; drag and drop any image onto the portrait frame. Images are auto-resized to keep file size reasonable. The portrait is included in ZIP exports and restored on import.</li>
                        <li><strong>Export as backup</strong> &mdash; use Export regularly to save <code>.zip</code> backup files. Browser/app storage can be wiped by OS updates. Old <code>.json</code> exports can still be imported.</li>
                        <li><strong>Multiple characters</strong> &mdash; save as many characters as you like. Use Load to switch between them.</li>
                        <li><strong>Flaw bonus feats</strong> &mdash; taking 1-2 flaws at character creation gives you extra feats. The penalties are automatically tracked.</li>
                    </ul>
                `
            },
            {
                title: 'Data Sources & Credits',
                body: `
                    <p>This character sheet uses data from the following sources, all under the <strong>Open Game License (OGL)</strong>:</p>
                    <ul>
                        <li><strong>PCGen 6.08.00RC10</strong> &mdash; the primary data source for races, classes, skills, feats, spells, equipment, and more.</li>
                        <li><strong>realmshelps.net</strong> &mdash; supplementary reference data.</li>
                        <li><strong>3.5 SRD</strong> &mdash; the System Reference Document for core rules and mechanics.</li>
                    </ul>
                    <p style="margin-top: 12px;"><strong>Database counts:</strong></p>
                    <div class="help-stats-grid">
                        <span class="help-stat"><strong>49</strong> Races</span>
                        <span class="help-stat"><strong>11</strong> Classes</span>
                        <span class="help-stat"><strong>90</strong> Skills</span>
                        <span class="help-stat"><strong>3,421</strong> Feats</span>
                        <span class="help-stat"><strong>4,686</strong> Spells</span>
                        <span class="help-stat"><strong>2,868</strong> Items</span>
                        <span class="help-stat"><strong>111</strong> Weapons</span>
                        <span class="help-stat"><strong>92</strong> Flaws</span>
                        <span class="help-stat"><strong>29</strong> Languages</span>
                    </div>
                `
            }
        ];
    }
}

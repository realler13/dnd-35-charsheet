// abilitiesTab.js - Abilities Tab UI and Logic

class AbilitiesTab {
    constructor() {
        this.container = document.getElementById('abilitiesTabContent');
        this.setupUI();
        this.attachEventListeners();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="card">
                <h2>Race Selection</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="abilityRaceSelect">Race:</label>
                        <select id="abilityRaceSelect" class="form-control">
                            <option value="">Select Race</option>
                        </select>
                    </div>
                    <div class="race-info-display" id="abilityRaceInfo"></div>
                </div>
            </div>

            <div class="card">
                <h2>Ability Scores</h2>
                <p class="info-text">Set your base ability scores. Racial and level-up bonuses will be added automatically.</p>

                <div class="ability-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Ability</th>
                                <th>Base</th>
                                <th>Racial</th>
                                <th>Lvl 4</th>
                                <th>Lvl 8</th>
                                <th>Lvl 12</th>
                                <th>Lvl 16</th>
                                <th>Lvl 20</th>
                                <th>Magic</th>
                                <th>Misc</th>
                                <th>Temp</th>
                                <th>Total</th>
                                <th>Mod</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr data-ability="str">
                                <td class="ability-name">Strength</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="str" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="str">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="str">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="str">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="str">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="str">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="str">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="str" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="str" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="str" value="0"></td>
                                <td class="total-score" data-ability="str">10</td>
                                <td class="modifier" data-ability="str">+0</td>
                            </tr>
                            <tr data-ability="dex">
                                <td class="ability-name">Dexterity</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="dex" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="dex">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="dex">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="dex">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="dex">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="dex">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="dex">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="dex" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="dex" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="dex" value="0"></td>
                                <td class="total-score" data-ability="dex">10</td>
                                <td class="modifier" data-ability="dex">+0</td>
                            </tr>
                            <tr data-ability="con">
                                <td class="ability-name">Constitution</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="con" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="con">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="con">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="con">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="con">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="con">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="con">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="con" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="con" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="con" value="0"></td>
                                <td class="total-score" data-ability="con">10</td>
                                <td class="modifier" data-ability="con">+0</td>
                            </tr>
                            <tr data-ability="int">
                                <td class="ability-name">Intelligence</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="int" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="int">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="int">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="int">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="int">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="int">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="int">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="int" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="int" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="int" value="0"></td>
                                <td class="total-score" data-ability="int">10</td>
                                <td class="modifier" data-ability="int">+0</td>
                            </tr>
                            <tr data-ability="wis">
                                <td class="ability-name">Wisdom</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="wis" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="wis">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="wis">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="wis">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="wis">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="wis">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="wis">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="wis" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="wis" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="wis" value="0"></td>
                                <td class="total-score" data-ability="wis">10</td>
                                <td class="modifier" data-ability="wis">+0</td>
                            </tr>
                            <tr data-ability="cha">
                                <td class="ability-name">Charisma</td>
                                <td><input type="number" class="ability-input" data-category="base" data-ability="cha" value="10" min="1" max="30"></td>
                                <td class="racial-bonus" data-ability="cha">0</td>
                                <td>
                                    <select class="level-up-select" data-level="4">
                                        <option value="">-</option>
                                        <option value="cha">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="8">
                                        <option value="">-</option>
                                        <option value="cha">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="12">
                                        <option value="">-</option>
                                        <option value="cha">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="16">
                                        <option value="">-</option>
                                        <option value="cha">+1</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="level-up-select" data-level="20">
                                        <option value="">-</option>
                                        <option value="cha">+1</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ability-input small" data-category="magic" data-ability="cha" value="0" min="0"></td>
                                <td><input type="number" class="ability-input small" data-category="misc" data-ability="cha" value="0"></td>
                                <td><input type="number" class="ability-input small" data-category="temp" data-ability="cha" value="0"></td>
                                <td class="total-score" data-ability="cha">10</td>
                                <td class="modifier" data-ability="cha">+0</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="point-buy-info">
                    <p><strong>Point Buy Total:</strong> <span id="pointBuyTotal">0</span></p>
                    <p class="info-text">Standard arrays: Elite (15,14,13,12,10,8), Standard (13,12,11,10,9,8), Low-Powered (10,10,10,10,10,10)</p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Race selection
        const raceSelect = document.getElementById('abilityRaceSelect');
        raceSelect.addEventListener('change', (e) => this.onRaceChange(e));

        // Ability score inputs
        const abilityInputs = this.container.querySelectorAll('.ability-input');
        abilityInputs.forEach(input => {
            input.addEventListener('change', (e) => this.onAbilityChange(e));
        });

        // Level-up selections
        const levelUpSelects = this.container.querySelectorAll('.level-up-select');
        levelUpSelects.forEach(select => {
            select.addEventListener('change', (e) => this.onLevelUpChange(e));
        });

        // Populate race dropdown
        this.populateRaceDropdown();
    }

    populateRaceDropdown() {
        const raceSelect = document.getElementById('abilityRaceSelect');
        const races = dataLoader.getAllRaces();

        races.forEach(race => {
            const option = document.createElement('option');
            option.value = race.name;
            option.textContent = race.name;
            raceSelect.appendChild(option);
        });
    }

    onRaceChange(e) {
        const raceName = e.target.value;
        const raceData = dataLoader.getRace(raceName);

        if (raceData) {
            character.updateRace(raceName, raceData);
            this.displayRaceInfo(raceData);
        }
    }

    displayRaceInfo(raceData) {
        const infoDiv = document.getElementById('abilityRaceInfo');
        const abilityMods = [];

        if (raceData.str !== 0) abilityMods.push(`STR ${raceData.str > 0 ? '+' : ''}${raceData.str}`);
        if (raceData.dex !== 0) abilityMods.push(`DEX ${raceData.dex > 0 ? '+' : ''}${raceData.dex}`);
        if (raceData.con !== 0) abilityMods.push(`CON ${raceData.con > 0 ? '+' : ''}${raceData.con}`);
        if (raceData.int !== 0) abilityMods.push(`INT ${raceData.int > 0 ? '+' : ''}${raceData.int}`);
        if (raceData.wis !== 0) abilityMods.push(`WIS ${raceData.wis > 0 ? '+' : ''}${raceData.wis}`);
        if (raceData.cha !== 0) abilityMods.push(`CHA ${raceData.cha > 0 ? '+' : ''}${raceData.cha}`);

        infoDiv.innerHTML = `
            <div class="race-details">
                <p><strong>Size:</strong> ${raceData.size}</p>
                <p><strong>Speed:</strong> ${raceData.landSpeed} ft.</p>
                <p><strong>Ability Modifiers:</strong> ${abilityMods.length > 0 ? abilityMods.join(', ') : 'None'}</p>
            </div>
        `;
    }

    onAbilityChange(e) {
        const category = e.target.dataset.category;
        const ability = e.target.dataset.ability;
        const value = e.target.value;

        character.updateAbilityScore(category, ability, value);
    }

    onLevelUpChange(e) {
        const level = parseInt(e.target.dataset.level);
        const ability = e.target.value;

        if (ability) {
            character.addLevelUpAbility(level, ability);
        } else {
            // Remove the level-up bonus
            const data = character.getData();
            delete data.abilities.levelUps[level];
            character.setData(data);
        }
    }

    render() {
        const data = character.getData();
        const stats = calculator.calculateAll(data);

        // Update race selection
        const raceSelect = document.getElementById('abilityRaceSelect');
        if (raceSelect) {
            raceSelect.value = data.race;
            const raceData = dataLoader.getRace(data.race);
            if (raceData) {
                this.displayRaceInfo(raceData);
            }
        }

        // Update ability inputs
        const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        abilities.forEach(ability => {
            // Base
            const baseInput = this.container.querySelector(`.ability-input[data-category="base"][data-ability="${ability}"]`);
            if (baseInput) baseInput.value = data.abilities.base[ability];

            // Racial bonus display
            const racialDisplay = this.container.querySelector(`.racial-bonus[data-ability="${ability}"]`);
            if (racialDisplay) {
                const racial = data.abilities.racial[ability] || 0;
                racialDisplay.textContent = racial > 0 ? `+${racial}` : racial;
            }

            // Magic, Misc, Temp
            ['magic', 'misc', 'temp'].forEach(category => {
                const input = this.container.querySelector(`.ability-input[data-category="${category}"][data-ability="${ability}"]`);
                if (input) input.value = data.abilities[category][ability] || 0;
            });

            // Total and modifier
            const totalDisplay = this.container.querySelector(`.total-score[data-ability="${ability}"]`);
            const modDisplay = this.container.querySelector(`.modifier[data-ability="${ability}"]`);

            if (totalDisplay && stats.abilities[ability]) {
                totalDisplay.textContent = stats.abilities[ability].score;
            }

            if (modDisplay && stats.abilities[ability]) {
                const mod = stats.abilities[ability].modifier;
                modDisplay.textContent = mod >= 0 ? `+${mod}` : mod;
                modDisplay.className = `modifier ${mod < 0 ? 'negative' : ''}`;
            }
        });

        // Update level-up selections
        Object.entries(data.abilities.levelUps || {}).forEach(([level, ability]) => {
            const select = this.container.querySelector(`.level-up-select[data-level="${level}"]`);
            if (select) {
                const option = select.querySelector(`option[value="${ability}"]`);
                if (option) option.selected = true;
            }
        });

        // Calculate point buy (simplified)
        this.calculatePointBuy(data.abilities.base);
    }

    calculatePointBuy(baseAbilities) {
        // Standard D&D 3.5 point buy costs
        const costs = {
            8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5,
            14: 6, 15: 8, 16: 10, 17: 13, 18: 16
        };

        let total = 0;
        Object.values(baseAbilities).forEach(score => {
            total += costs[score] || 0;
        });

        const pointBuyDisplay = document.getElementById('pointBuyTotal');
        if (pointBuyDisplay) {
            pointBuyDisplay.textContent = total;
        }
    }
}

window.AbilitiesTab = AbilitiesTab;

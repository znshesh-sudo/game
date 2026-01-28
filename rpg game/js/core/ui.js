// js/core/ui.js
/**
 * UI Manager - Handles all user interface updates and interactions
 */

const UI = {
    // Initialize UI
    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.updateAllUI();
        
        // Check if character creation is needed
        if (!DataManager.gameState.player.name || DataManager.gameState.player.name === 'Adventurer') {
            this.showCharacterCreation();
        }
    },
    
    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            // Player info
            playerName: document.getElementById('player-name'),
            playerLevel: document.getElementById('player-level'),
            healthBarFill: document.getElementById('health-bar-fill'),
            healthText: document.getElementById('health-text'),
            
            // Character stats
            characterRace: document.getElementById('character-race'),
            characterClass: document.getElementById('character-class'),
            statAtk: document.getElementById('stat-atk'),
            statDef: document.getElementById('stat-def'),
            statSpd: document.getElementById('stat-spd'),
            statCrit: document.getElementById('stat-crit'),
            
            // Inventory
            inventoryItems: document.getElementById('inventory-items'),
            goldAmount: document.getElementById('gold-amount'),
            
            // Game log
            gameLog: document.getElementById('game-log'),
            
            // Combat
            enemyIcon: document.getElementById('enemy-icon'),
            enemyName: document.getElementById('enemy-name'),
            enemyHealthFill: document.getElementById('enemy-health-fill'),
            enemyHealthText: document.getElementById('enemy-health-text'),
            
            // Footer
            xpCurrent: document.getElementById('xp-current'),
            xpNeeded: document.getElementById('xp-needed'),
            playTime: document.getElementById('play-time'),
            systemLog: document.getElementById('system-log'),
            gameSpeed: document.getElementById('game-speed'),
            
            // Modals
            characterCreationModal: document.getElementById('character-creation-modal'),
            redeemModal: document.getElementById('redeem-modal'),
            
            // Buttons
            btnSave: document.getElementById('btn-save'),
            btnLoad: document.getElementById('btn-load'),
            btnReset: document.getElementById('btn-reset'),
            btnRedeem: document.getElementById('btn-redeem'),
            btnClearLog: document.getElementById('btn-clear-log'),
            btnAutoScroll: document.getElementById('btn-auto-scroll'),
            btnFlee: document.getElementById('btn-flee'),
            btnAttack: document.getElementById('btn-attack'),
            btnSkill1: document.getElementById('btn-skill-1'),
            btnSkill2: document.getElementById('btn-skill-2'),
            btnUseItem: document.getElementById('btn-use-item'),
            
            // Navigation buttons
            btnTown: document.getElementById('btn-town'),
            btnDungeon: document.getElementById('btn-dungeon'),
            btnForest: document.getElementById('btn-forest'),
            btnMine: document.getElementById('btn-mine'),
            
            // Activity buttons
            btnMine: document.getElementById('btn-mine'),
            btnForage: document.getElementById('btn-forage'),
            btnLumber: document.getElementById('btn-lumber'),
            btnHunt: document.getElementById('btn-hunt'),
            btnForge: document.getElementById('btn-forge'),
            btnCook: document.getElementById('btn-cook'),
            
            // Quest
            questTitle: document.getElementById('quest-title'),
            questDesc: document.getElementById('quest-desc'),
            questProgress: document.getElementById('quest-progress'),
            btnNewQuest: document.getElementById('btn-new-quest'),
            
            // Shop
            btnBuyItems: document.getElementById('btn-buy-items'),
            btnSellItems: document.getElementById('btn-sell-items'),
            btnBuyEquipment: document.getElementById('btn-buy-equipment'),
            
            // Character creation
            raceOptions: document.getElementById('race-options'),
            classOptions: document.getElementById('class-options'),
            characterNameInput: document.getElementById('character-name-input'),
            btnConfirmName: document.getElementById('btn-confirm-name'),
            btnPrevStep: document.getElementById('btn-prev-step'),
            btnNextStep: document.getElementById('btn-next-step'),
            
            // Redeem
            redeemCodeInput: document.getElementById('redeem-code-input'),
            btnRedeemCode: document.getElementById('btn-redeem-code')
        };
    },
    
    // Bind event listeners
    bindEvents: function() {
        // System buttons
        this.elements.btnSave.addEventListener('click', () => DataManager.saveGameState());
        this.elements.btnLoad.addEventListener('click', () => {
            DataManager.loadGameState();
            this.updateAllUI();
        });
        this.elements.btnReset.addEventListener('click', () => {
            if (DataManager.resetGame()) {
                this.updateAllUI();
            }
        });
        this.elements.btnRedeem.addEventListener('click', () => this.showRedeemModal());
        
        // Log controls
        this.elements.btnClearLog.addEventListener('click', () => this.clearGameLog());
        this.elements.btnAutoScroll.addEventListener('click', (e) => {
            const enabled = e.target.classList.toggle('active');
            DataManager.gameState.settings.autoScroll = enabled;
        });
        
        // Combat buttons
        this.elements.btnAttack.addEventListener('click', () => {
            if (window.CombatSystem && CombatSystem.currentEnemy) {
                CombatSystem.playerAttack();
            }
        });
        this.elements.btnFlee.addEventListener('click', () => {
            if (window.CombatSystem) {
                CombatSystem.fleeCombat();
            }
        });
        
        // Navigation buttons
        this.elements.btnTown.addEventListener('click', () => this.navigateTo('town'));
        this.elements.btnDungeon.addEventListener('click', () => this.navigateTo('dungeon'));
        this.elements.btnForest.addEventListener('click', () => this.navigateTo('forest'));
        this.elements.btnMine.addEventListener('click', () => this.navigateTo('mine'));
        
        // Activity buttons
        this.elements.btnMine.addEventListener('click', () => this.performActivity('mining'));
        this.elements.btnForage.addEventListener('click', () => this.performActivity('foraging'));
        this.elements.btnLumber.addEventListener('click', () => this.performActivity('lumberjack'));
        this.elements.btnHunt.addEventListener('click', () => this.performActivity('hunting'));
        this.elements.btnForge.addEventListener('click', () => this.performActivity('forging'));
        this.elements.btnCook.addEventListener('click', () => this.performActivity('cooking'));
        
        // Quest button
        this.elements.btnNewQuest.addEventListener('click', () => {
            if (window.QuestSystem) {
                QuestSystem.generateNewQuest();
            }
        });
        
        // Shop buttons
        this.elements.btnBuyItems.addEventListener('click', () => this.showShop('items'));
        this.elements.btnSellItems.addEventListener('click', () => this.showShop('sell'));
        this.elements.btnBuyEquipment.addEventListener('click', () => this.showShop('equipment'));
        
        // Character creation
        this.elements.btnConfirmName.addEventListener('click', () => this.completeCharacterCreation());
        this.elements.btnPrevStep.addEventListener('click', () => this.prevCreationStep());
        this.elements.btnNextStep.addEventListener('click', () => this.nextCreationStep());
        this.elements.characterNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.completeCharacterCreation();
        });
        
        // Redeem
        this.elements.btnRedeemCode.addEventListener('click', () => this.redeemCode());
        this.elements.redeemCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.redeemCode();
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal(btn.closest('.modal'));
            });
        });
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
        
        // Game speed
        this.elements.gameSpeed.addEventListener('change', (e) => {
            DataManager.setGameSpeed(parseInt(e.target.value));
        });
        
        // Auto-battle toggle
        document.getElementById('auto-battle-toggle').addEventListener('change', (e) => {
            if (DataManager.isFeatureUnlocked('autoBattle')) {
                if (window.CombatSystem) {
                    CombatSystem.setAutoBattle(e.target.checked);
                }
            } else {
                e.target.checked = false;
                this.addToGameLog('Auto Battle is locked. Use redeem code: AUTO-BATTLE', 'system');
            }
        });
    },
    
    // Update all UI elements
    updateAllUI: function() {
        this.updatePlayerInfo();
        this.updateCharacterStats();
        this.updateInventory();
        this.updateQuestInfo();
        this.updateGameLog();
        this.updateFooter();
    },
    
    // Update player information
    updatePlayerInfo: function() {
        const player = DataManager.gameState.player;
        const stats = player.stats;
        
        // Basic info
        this.elements.playerName.textContent = player.name;
        this.elements.playerLevel.textContent = player.level;
        
        // Health bar
        const healthPercent = (stats.hp / stats.maxHp) * 100;
        this.elements.healthBarFill.style.width = `${healthPercent}%`;
        this.elements.healthText.textContent = `${stats.hp}/${stats.maxHp}`;
        
        // Gold
        this.elements.goldAmount.textContent = Utils.formatNumber(player.gold);
        
        // Experience
        const expNeeded = Utils.calculateExpNeeded(player.level);
        this.elements.xpCurrent.textContent = Utils.formatNumber(player.experience);
        this.elements.xpNeeded.textContent = Utils.formatNumber(expNeeded);
    },
    
    // Update character stats display
    updateCharacterStats: function() {
        const player = DataManager.gameState.player;
        const stats = player.stats;
        
        this.elements.characterRace.textContent = Utils.capitalize(player.race);
        this.elements.characterClass.textContent = Utils.capitalize(player.class);
        this.elements.statAtk.textContent = stats.atk;
        this.elements.statDef.textContent = stats.def;
        this.elements.statSpd.textContent = stats.spd;
        this.elements.statCrit.textContent = `${stats.crit}%`;
        
        // Update character icon based on class
        const iconMap = {
            warrior: 'fa-user-shield',
            mage: 'fa-hat-wizard',
            archer: 'fa-bow-arrow',
            rogue: 'fa-user-ninja',
            cleric: 'fa-hands-praying'
        };
        
        const iconClass = iconMap[player.class] || 'fa-user';
        this.elements.characterIcon.className = `fas ${iconClass}`;
    },
    
    // Update inventory display
    updateInventory: function() {
        const inventory = DataManager.gameState.player.inventory;
        const container = this.elements.inventoryItems;
        
        // Clear container
        container.innerHTML = '';
        
        if (inventory.length === 0) {
            container.innerHTML = '<div class="empty-inventory">Inventory is empty</div>';
            return;
        }
        
        // Add items (limit to 9 for display)
        inventory.slice(0, 9).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
            `;
            
            itemElement.addEventListener('click', () => {
                this.showItemDetails(item);
            });
            
            container.appendChild(itemElement);
        });
        
        // Show more indicator if there are more items
        if (inventory.length > 9) {
            const moreElement = document.createElement('div');
            moreElement.className = 'inventory-item more-items';
            moreElement.textContent = `+${inventory.length - 9} more`;
            container.appendChild(moreElement);
        }
    },
    
    // Update quest information
    updateQuestInfo: function() {
        const activeQuest = DataManager.getActiveQuest();
        
        if (activeQuest) {
            this.elements.questTitle.textContent = activeQuest.title;
            this.elements.questDesc.textContent = activeQuest.description;
            
            // Update progress bar
            const progress = activeQuest.progress || 0;
            const goal = activeQuest.goal || 1;
            const percent = (progress / goal) * 100;
            
            const progressBar = this.elements.questProgress.querySelector('.progress-fill');
            progressBar.style.width = `${Math.min(percent, 100)}%`;
            
            // Update button text
            this.elements.btnNewQuest.innerHTML = '<i class="fas fa-sync"></i> Abandon Quest';
        } else {
            this.elements.questTitle.textContent = 'No Active Quest';
            this.elements.questDesc.textContent = 'Visit the town to get a quest or generate one.';
            
            const progressBar = this.elements.questProgress.querySelector('.progress-fill');
            progressBar.style.width = '0%';
            
            // Update button text
            this.elements.btnNewQuest.innerHTML = '<i class="fas fa-dice"></i> Generate Quest';
        }
    },
    
    // Update game log
    updateGameLog: function() {
        // This is handled by addToGameLog method
    },
    
    // Update footer information
    updateFooter: function() {
        // Update play time
        this.elements.playTime.textContent = Utils.formatTime(DataManager.gameState.game.playTime);
        
        // Update game speed
        this.elements.gameSpeed.value = DataManager.getGameSpeed();
    },
    
    // Add message to game log
    addToGameLog: function(message, type = 'system') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type} fade-in`;
        logEntry.textContent = message;
        
        this.elements.gameLog.appendChild(logEntry);
        
        // Auto-scroll if enabled
        if (DataManager.gameState.settings.autoScroll) {
            this.elements.gameLog.scrollTop = this.elements.gameLog.scrollHeight;
        }
        
        // Update system log in footer
        this.elements.systemLog.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        
        // Limit log entries to 50
        const entries = this.elements.gameLog.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    },
    
    // Clear game log
    clearGameLog: function() {
        this.elements.gameLog.innerHTML = '<div class="log-entry system">Game log cleared.</div>';
    },
    
    // Show character creation modal
    showCharacterCreation: function() {
        this.showModal(this.elements.characterCreationModal);
        this.loadRaceOptions();
        this.showCreationStep('race');
    },
    
    // Show redeem modal
    showRedeemModal: function() {
        this.showModal(this.elements.redeemModal);
        this.elements.redeemCodeInput.focus();
    },
    
    // Show modal
    showModal: function(modal) {
        modal.classList.add('active');
    },
    
    // Hide modal
    hideModal: function(modal) {
        modal.classList.remove('active');
    },
    
    // Load race options
    loadRaceOptions: function() {
        const container = this.elements.raceOptions;
        container.innerHTML = '';
        
        // Load from JSON data
        const races = GameData.races || [
            { id: 'human', name: 'Human', description: 'Balanced and adaptable' },
            { id: 'elf', name: 'Elf', description: 'Agile with magical affinity' },
            { id: 'dwarf', name: 'Dwarf', description: 'Strong and resistant' }
        ];
        
        races.forEach(race => {
            // Only show discovered races
            if (DataManager.gameState.player.discoveredRaces.includes(race.id)) {
                const option = document.createElement('div');
                option.className = 'race-option';
                option.dataset.raceId = race.id;
                option.innerHTML = `
                    <h4>${race.name}</h4>
                    <p>${race.description}</p>
                `;
                
                option.addEventListener('click', () => {
                    document.querySelectorAll('.race-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    this.selectedRace = race.id;
                });
                
                container.appendChild(option);
            }
        });
        
        // Auto-select first option
        if (container.firstChild) {
            container.firstChild.click();
        }
    },
    
    // Show creation step
    showCreationStep: function(step) {
        document.querySelectorAll('.creation-step').forEach(el => {
            el.classList.add('hidden');
        });
        
        document.getElementById(`step-${step}`).classList.remove('hidden');
        this.currentCreationStep = step;
    },
    
    // Next creation step
    nextCreationStep: function() {
        const steps = ['race', 'class', 'name'];
        const currentIndex = steps.indexOf(this.currentCreationStep);
        
        if (currentIndex < steps.length - 1) {
            this.showCreationStep(steps[currentIndex + 1]);
            
            if (steps[currentIndex + 1] === 'class') {
                this.loadClassOptions();
            }
        }
    },
    
    // Previous creation step
    prevCreationStep: function() {
        const steps = ['race', 'class', 'name'];
        const currentIndex = steps.indexOf(this.currentCreationStep);
        
        if (currentIndex > 0) {
            this.showCreationStep(steps[currentIndex - 1]);
        }
    },
    
    // Load class options
    loadClassOptions: function() {
        const container = this.elements.classOptions;
        container.innerHTML = '';
        
        // Load from JSON data
        const classes = GameData.classes || [
            { id: 'warrior', name: 'Warrior', description: 'Master of melee combat' },
            { id: 'mage', name: 'Mage', description: 'Wielder of arcane magic' },
            { id: 'archer', name: 'Archer', description: 'Expert marksman' }
        ];
        
        classes.forEach(cls => {
            // Only show discovered classes
            if (DataManager.gameState.player.discoveredClasses.includes(cls.id)) {
                const option = document.createElement('div');
                option.className = 'class-option';
                option.dataset.classId = cls.id;
                option.innerHTML = `
                    <h4>${cls.name}</h4>
                    <p>${cls.description}</p>
                `;
                
                option.addEventListener('click', () => {
                    document.querySelectorAll('.class-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    this.selectedClass = cls.id;
                });
                
                container.appendChild(option);
            }
        });
        
        // Auto-select first option
        if (container.firstChild) {
            container.firstChild.click();
        }
    },
    
    // Complete character creation
    completeCharacterCreation: function() {
        const name = this.elements.characterNameInput.value.trim();
        
        if (!name) {
            this.addToGameLog('Please enter a name for your character', 'system');
            return;
        }
        
        // Update player data
        DataManager.gameState.player.name = name;
        DataManager.gameState.player.race = this.selectedRace || 'human';
        DataManager.gameState.player.class = this.selectedClass || 'warrior';
        
        // Hide modal
        this.hideModal(this.elements.characterCreationModal);
        
        // Update UI
        this.updateAllUI();
        
        // Add welcome message
        this.addToGameLog(`Welcome, ${name}! You are a ${this.selectedRace} ${this.selectedClass}.`, 'system');
        this.addToGameLog('Your adventure begins now. Explore the world and grow stronger!', 'system');
    },
    
    // Navigate to location
    navigateTo: function(location) {
        DataManager.setCurrentLocation(location);
        
        // Update UI based on location
        switch (location) {
            case 'town':
                this.addToGameLog('You arrive at the town. Safe travels!', 'system');
                break;
            case 'dungeon':
                this.addToGameLog('You enter the dark dungeon. Be careful!', 'system');
                if (window.DungeonSystem) {
                    DungeonSystem.enterDungeon();
                }
                break;
            case 'forest':
                this.addToGameLog('You venture into the mysterious forest.', 'system');
                break;
            case 'mine':
                this.addToGameLog('You descend into the mine. Watch your step!', 'system');
                break;
        }
    },
    
    // Perform activity
    performActivity: function(activity) {
        if (window.ProfessionSystem) {
            ProfessionSystem.performActivity(activity);
        }
    },
    
    // Show shop
    showShop: function(type) {
        if (window.ShopSystem) {
            ShopSystem.showShop(type);
        }
    },
    
    // Redeem code
    redeemCode: function() {
        const code = this.elements.redeemCodeInput.value.trim().toUpperCase();
        
        if (!code) {
            this.addToGameLog('Please enter a redeem code', 'system');
            return;
        }
        
        if (window.RedeemSystem) {
            RedeemSystem.redeemCode(code);
            this.elements.redeemCodeInput.value = '';
            this.hideModal(this.elements.redeemModal);
        }
    },
    
    // Show item details
    showItemDetails: function(item) {
        const message = `${item.name}: ${item.description || 'No description available.'}`;
        this.addToGameLog(message, 'system');
    },
    
    // Update enemy display
    updateEnemyDisplay: function(enemy) {
        if (!enemy) {
            this.elements.enemyName.textContent = '- No Enemy -';
            this.elements.enemyHealthText.textContent = '-/-';
            this.elements.enemyHealthFill.style.width = '0%';
            
            // Reset enemy icon
            this.elements.enemyIcon.innerHTML = '<i class="fas fa-pastafarianism"></i>';
            return;
        }
        
        this.elements.enemyName.textContent = enemy.name;
        
        const healthPercent = (enemy.hp / enemy.maxHp) * 100;
        this.elements.enemyHealthFill.style.width = `${healthPercent}%`;
        this.elements.enemyHealthText.textContent = `${Math.floor(enemy.hp)}/${enemy.maxHp}`;
        
        // Update enemy icon based on type
        const iconMap = {
            goblin: 'fa-ghost',
            orc: 'fa-monster',
            wolf: 'fa-paw',
            skeleton: 'fa-skull',
            dragon: 'fa-dragon'
        };
        
        const enemyType = enemy.type || 'default';
        const iconClass = iconMap[enemyType] || 'fa-pastafarianism';
        this.elements.enemyIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        
        // Add spawn animation
        this.elements.enemyIcon.classList.add('enemy-spawn');
        setTimeout(() => {
            this.elements.enemyIcon.classList.remove('enemy-spawn');
        }, 1000);
    },
    
    // Show level up animation
    showLevelUpAnimation: function() {
        const levelElement = this.elements.playerLevel;
        levelElement.classList.add('level-up-animation');
        
        setTimeout(() => {
            levelElement.classList.remove('level-up-animation');
        }, 500);
    },
    
    // Show damage animation
    showDamageAnimation: function(target, isPlayer = false) {
        const element = isPlayer ? this.elements.healthBarFill : this.elements.enemyHealthFill;
        element.parentElement.classList.add('damage-animation');
        
        setTimeout(() => {
            element.parentElement.classList.remove('damage-animation');
        }, 500);
    },
    
    // Show heal animation
    showHealAnimation: function(isPlayer = false) {
        const element = isPlayer ? this.elements.healthBarFill : this.elements.enemyHealthFill;
        element.parentElement.classList.add('heal-animation');
        
        setTimeout(() => {
            element.parentElement.classList.remove('heal-animation');
        }, 500);
    },
    
    // Show critical hit animation
    showCriticalHit: function() {
        const logEntries = this.elements.gameLog.querySelectorAll('.log-entry');
        if (logEntries.length > 0) {
            const lastEntry = logEntries[logEntries.length - 1];
            lastEntry.classList.add('critical-hit');
        }
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.UI = UI;
}
// js/core/dataManager.js
/**
 * Data Manager - Handles game data storage and retrieval
 */

const DataManager = {
    // Game state
    gameState: null,
    
    // Default game state
    defaultState: {
        player: {
            name: 'Adventurer',
            level: 1,
            experience: 0,
            gold: 50,
            race: 'human',
            class: 'warrior',
            stats: {
                hp: 100,
                maxHp: 100,
                atk: 10,
                def: 8,
                spd: 5,
                crit: 5,
                critDamage: 150
            },
            inventory: [],
            equipment: {},
            skills: [],
            professionLevels: {
                mining: 1,
                foraging: 1,
                lumberjack: 1,
                hunting: 1,
                forging: 1,
                cooking: 1
            },
            unlockedFeatures: [],
            discoveredRaces: ['human', 'elf', 'dwarf'],
            discoveredClasses: ['warrior', 'mage', 'archer']
        },
        game: {
            currentLocation: 'town',
            dungeonFloor: 1,
            playTime: 0,
            lastSave: null,
            gameVersion: '1.0.0'
        },
        quests: {
            active: null,
            completed: [],
            generatedQuests: []
        },
        monsters: {
            defeated: []
        },
        settings: {
            gameSpeed: 2,
            autoScroll: true,
            soundEnabled: true
        }
    },
    
    // Initialize data manager
    init: function() {
        this.loadGameState();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveGameState();
            this.addToLog('Game auto-saved', 'system');
        }, 30000);
        
        return this.gameState;
    },
    
    // Load game state from localStorage
    loadGameState: function() {
        const saved = Utils.loadFromStorage('eternalRealmsSave');
        
        if (saved) {
            // Merge with default state to ensure all properties exist
            this.gameState = this.mergeDeep(this.defaultState, saved);
            this.addToLog('Game loaded successfully', 'system');
        } else {
            this.gameState = Utils.deepClone(this.defaultState);
            this.addToLog('New game started', 'system');
        }
        
        // Update last loaded time
        this.gameState.game.lastLoad = new Date().toISOString();
        
        return this.gameState;
    },
    
    // Save game state to localStorage
    saveGameState: function() {
        if (!this.gameState) return false;
        
        this.gameState.game.lastSave = new Date().toISOString();
        const success = Utils.saveToStorage('eternalRealmsSave', this.gameState);
        
        if (success) {
            this.addToLog('Game saved', 'system');
        } else {
            this.addToLog('Failed to save game', 'system');
        }
        
        return success;
    },
    
    // Reset game to default state
    resetGame: function() {
        if (confirm('Are you sure you want to reset your game? All progress will be lost!')) {
            Utils.removeFromStorage('eternalRealmsSave');
            this.gameState = Utils.deepClone(this.defaultState);
            this.addToLog('Game reset to default', 'system');
            return true;
        }
        return false;
    },
    
    // Merge objects deeply
    mergeDeep: function(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    },
    
    // Check if value is an object
    isObject: function(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },
    
    // Update player stats
    updatePlayerStats: function(stats) {
        Object.assign(this.gameState.player.stats, stats);
    },
    
    // Add item to inventory
    addItemToInventory: function(item, quantity = 1) {
        const inventory = this.gameState.player.inventory;
        const existingItem = inventory.find(i => i.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            inventory.push({
                ...item,
                quantity: quantity
            });
        }
        
        this.addToLog(`Obtained ${quantity}x ${item.name}`, 'loot');
    },
    
    // Remove item from inventory
    removeItemFromInventory: function(itemId, quantity = 1) {
        const inventory = this.gameState.player.inventory;
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
            if (inventory[itemIndex].quantity > quantity) {
                inventory[itemIndex].quantity -= quantity;
            } else {
                inventory.splice(itemIndex, 1);
            }
            return true;
        }
        return false;
    },
    
    // Check if player has item
    hasItem: function(itemId, quantity = 1) {
        const item = this.gameState.player.inventory.find(i => i.id === itemId);
        return item && item.quantity >= quantity;
    },
    
    // Add gold
    addGold: function(amount) {
        this.gameState.player.gold += amount;
        this.addToLog(`+${amount} Gold`, 'loot');
        return this.gameState.player.gold;
    },
    
    // Remove gold
    removeGold: function(amount) {
        if (this.gameState.player.gold >= amount) {
            this.gameState.player.gold -= amount;
            return true;
        }
        return false;
    },
    
    // Add experience
    addExperience: function(amount) {
        const player = this.gameState.player;
        player.experience += amount;
        
        const expNeeded = Utils.calculateExpNeeded(player.level);
        
        if (player.experience >= expNeeded) {
            this.levelUp();
        }
        
        this.addToLog(`+${amount} XP`, 'system');
    },
    
    // Level up player
    levelUp: function() {
        const player = this.gameState.player;
        player.level += 1;
        player.experience = 0;
        
        // Increase stats on level up
        player.stats.maxHp += 10;
        player.stats.hp = player.stats.maxHp;
        player.stats.atk += 2;
        player.stats.def += 1;
        player.stats.spd += 0.5;
        player.stats.crit += 0.5;
        
        this.addToLog(`Level Up! You are now level ${player.level}`, 'system');
        
        // Show level up animation
        if (window.UI) {
            UI.showLevelUpAnimation();
        }
    },
    
    // Update game time
    updatePlayTime: function() {
        this.gameState.game.playTime += 1;
    },
    
    // Add message to game log
    addToLog: function(message, type = 'system') {
        if (window.UI) {
            UI.addToGameLog(message, type);
        }
    },
    
    // Get player stat
    getPlayerStat: function(statName) {
        return this.gameState.player.stats[statName] || 0;
    },
    
    // Update player race
    updatePlayerRace: function(race) {
        this.gameState.player.race = race;
        
        // Add to discovered races if not already
        if (!this.gameState.player.discoveredRaces.includes(race)) {
            this.gameState.player.discoveredRaces.push(race);
        }
    },
    
    // Update player class
    updatePlayerClass: function(playerClass) {
        this.gameState.player.class = playerClass;
        
        // Add to discovered classes if not already
        if (!this.gameState.player.discoveredClasses.includes(playerClass)) {
            this.gameState.player.discoveredClasses.push(playerClass);
        }
    },
    
    // Unlock feature
    unlockFeature: function(feature) {
        if (!this.gameState.player.unlockedFeatures.includes(feature)) {
            this.gameState.player.unlockedFeatures.push(feature);
            this.addToLog(`Unlocked feature: ${feature}`, 'system');
            return true;
        }
        return false;
    },
    
    // Check if feature is unlocked
    isFeatureUnlocked: function(feature) {
        return this.gameState.player.unlockedFeatures.includes(feature);
    },
    
    // Get current location
    getCurrentLocation: function() {
        return this.gameState.game.currentLocation;
    },
    
    // Set current location
    setCurrentLocation: function(location) {
        this.gameState.game.currentLocation = location;
        this.addToLog(`Moved to ${Utils.capitalize(location)}`, 'system');
    },
    
    // Get dungeon floor
    getDungeonFloor: function() {
        return this.gameState.game.dungeonFloor;
    },
    
    // Set dungeon floor
    setDungeonFloor: function(floor) {
        this.gameState.game.dungeonFloor = floor;
    },
    
    // Increment dungeon floor
    incrementDungeonFloor: function() {
        this.gameState.game.dungeonFloor += 1;
        return this.gameState.game.dungeonFloor;
    },
    
    // Get active quest
    getActiveQuest: function() {
        return this.gameState.quests.active;
    },
    
    // Set active quest
    setActiveQuest: function(quest) {
        this.gameState.quests.active = quest;
    },
    
    // Complete active quest
    completeActiveQuest: function() {
        if (this.gameState.quests.active) {
            this.gameState.quests.completed.push(this.gameState.quests.active);
            this.gameState.quests.active = null;
        }
    },
    
    // Get profession level
    getProfessionLevel: function(profession) {
        return this.gameState.player.professionLevels[profession] || 1;
    },
    
    // Add profession experience
    addProfessionExp: function(profession, amount = 1) {
        const currentLevel = this.getProfessionLevel(profession);
        this.gameState.player.professionLevels[profession] += amount;
        
        const newLevel = this.getProfessionLevel(profession);
        if (newLevel > currentLevel) {
            this.addToLog(`${Utils.capitalize(profession)} level increased to ${newLevel}!`, 'system');
        }
    },
    
    // Get game settings
    getGameSpeed: function() {
        return this.gameState.settings.gameSpeed;
    },
    
    // Set game speed
    setGameSpeed: function(speed) {
        this.gameState.settings.gameSpeed = speed;
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}
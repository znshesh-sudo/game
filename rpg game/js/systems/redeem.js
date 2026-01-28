// js/systems/redeem.js
/**
 * Redeem System - Handles redeem codes and feature unlocking
 */

const RedeemSystem = {
    // Valid redeem codes
    redeemCodes: {
        // Feature unlocks
        "AUTO-BATTLE": {
            type: "feature",
            feature: "autoBattle",
            message: "Auto Battle feature unlocked!",
            hidden: false,
            oneTime: true
        },
        "HIDDEN-RACE": {
            type: "feature",
            feature: "hiddenRaces",
            message: "Hidden races unlocked!",
            hidden: false,
            oneTime: true
        },
        "HIDDEN-CLASS": {
            type: "feature",
            feature: "hiddenClasses",
            message: "Hidden classes unlocked!",
            hidden: false,
            oneTime: true
        },
        
        // Rewards
        "START-1000": {
            type: "reward",
            reward: { gold: 1000 },
            message: "1000 gold added to your inventory!",
            hidden: false,
            oneTime: true
        },
        "XP-BOOST": {
            type: "reward",
            reward: { exp: 500 },
            message: "500 experience points gained!",
            hidden: false,
            oneTime: true
        },
        "LEGENDARY-ITEM": {
            type: "reward",
            reward: { items: [{ id: "legendary_sword", quantity: 1 }] },
            message: "Legendary sword obtained!",
            hidden: true,
            oneTime: true
        },
        
        // Unlock all (developer code)
        "DEVMODE": {
            type: "feature",
            feature: "devMode",
            message: "Developer mode activated! All features unlocked.",
            hidden: true,
            oneTime: true,
            unlocksAll: true
        },
        
        // Special event codes
        "ANNIVERSARY2024": {
            type: "reward",
            reward: { gold: 2024, exp: 2024 },
            message: "Happy Anniversary! 2024 gold and XP!",
            hidden: false,
            oneTime: true,
            expires: "2024-12-31"
        },
        "THANKYOU": {
            type: "reward",
            reward: { gold: 100, items: [{ id: "rare_potion", quantity: 3 }] },
            message: "Thank you for playing!",
            hidden: false,
            oneTime: true
        }
    },

    // Used codes storage
    usedCodes: [],
    unlockedFeatures: [],

    // Initialize redeem system
    init: function() {
        console.log("Redeem System initialized");
        this.loadUsedCodes();
        this.loadUnlockedFeatures();
        this.bindEvents();
    },

    // Load used codes from storage
    loadUsedCodes: function() {
        const saved = Utils.loadFromStorage('eternalRealmsUsedCodes');
        if (saved) {
            this.usedCodes = saved;
        }
    },

    // Save used codes
    saveUsedCodes: function() {
        Utils.saveToStorage('eternalRealmsUsedCodes', this.usedCodes);
    },

    // Load unlocked features
    loadUnlockedFeatures: function() {
        const saved = Utils.loadFromStorage('eternalRealmsUnlockedFeatures');
        if (saved) {
            this.unlockedFeatures = saved;
        } else {
            // Default features
            this.unlockedFeatures = [];
        }
    },

    // Save unlocked features
    saveUnlockedFeatures: function() {
        Utils.saveToStorage('eternalRealmsUnlockedFeatures', this.unlockedFeatures);
    },

    // Bind event listeners
    bindEvents: function() {
        // Already bound in ui.js
    },

    // Redeem a code
    redeemCode: function(code) {
        // Normalize code
        code = code.toUpperCase().trim();
        
        // Check if code is valid
        const codeData = this.redeemCodes[code];
        if (!codeData) {
            UI.addToGameLog("Invalid redeem code.", 'system');
            return false;
        }
        
        // Check if code has expired
        if (codeData.expires) {
            const expireDate = new Date(codeData.expires);
            if (Date.now() > expireDate.getTime()) {
                UI.addToGameLog("This redeem code has expired.", 'system');
                return false;
            }
        }
        
        // Check if code has already been used
        if (this.usedCodes.includes(code) && codeData.oneTime) {
            UI.addToGameLog("This code has already been redeemed.", 'system');
            return false;
        }
        
        // Process the code
        let success = false;
        
        switch (codeData.type) {
            case "feature":
                success = this.unlockFeature(codeData.feature, codeData.unlocksAll);
                break;
                
            case "reward":
                success = this.giveReward(codeData.reward);
                break;
                
            default:
                UI.addToGameLog("Unknown code type.", 'system');
                return false;
        }
        
        if (success) {
            // Mark code as used
            if (codeData.oneTime && !this.usedCodes.includes(code)) {
                this.usedCodes.push(code);
                this.saveUsedCodes();
            }
            
            // Show success message
            UI.addToGameLog(`Code redeemed: ${codeData.message}`, 'system');
            
            // Special effects
            this.showRedemptionEffects(code);
            
            return true;
        }
        
        return false;
    },

    // Unlock a feature
    unlockFeature: function(feature, unlocksAll = false) {
        // If unlocking all features
        if (unlocksAll) {
            const allFeatures = [
                "autoBattle",
                "hiddenRaces", 
                "hiddenClasses",
                "advancedSkills",
                "premiumShop",
                "unlimitedInventory"
            ];
            
            allFeatures.forEach(feat => {
                if (!this.unlockedFeatures.includes(feat)) {
                    this.unlockedFeatures.push(feat);
                    DataManager.unlockFeature(feat);
                }
            });
            
            this.saveUnlockedFeatures();
            return true;
        }
        
        // Unlock single feature
        if (!this.unlockedFeatures.includes(feature)) {
            this.unlockedFeatures.push(feature);
            this.saveUnlockedFeatures();
            DataManager.unlockFeature(feature);
            
            // Apply feature-specific actions
            this.applyFeatureUnlock(feature);
            
            return true;
        }
        
        return false;
    },

    // Apply feature-specific actions
    applyFeatureUnlock: function(feature) {
        switch (feature) {
            case "autoBattle":
                // Enable auto-battle toggle
                const toggle = document.getElementById('auto-battle-toggle');
                if (toggle) {
                    toggle.disabled = false;
                    toggle.parentElement.style.opacity = "1";
                }
                break;
                
            case "hiddenRaces":
                // Add hidden races to discovered races
                const hiddenRaces = ["vampire", "werewolf", "demon", "angel"];
                hiddenRaces.forEach(race => {
                    if (!DataManager.gameState.player.discoveredRaces.includes(race)) {
                        DataManager.gameState.player.discoveredRaces.push(race);
                    }
                });
                break;
                
            case "hiddenClasses":
                // Add hidden classes to discovered classes
                const hiddenClasses = ["necromancer", "paladin", "druid", "berserker"];
                hiddenClasses.forEach(cls => {
                    if (!DataManager.gameState.player.discoveredClasses.includes(cls)) {
                        DataManager.gameState.player.discoveredClasses.push(cls);
                    }
                });
                break;
        }
    },

    // Give reward from code
    giveReward: function(reward) {
        try {
            // Gold reward
            if (reward.gold) {
                DataManager.addGold(reward.gold);
            }
            
            // Experience reward
            if (reward.exp) {
                DataManager.addExperience(reward.exp);
            }
            
            // Item rewards
            if (reward.items) {
                reward.items.forEach(itemReward => {
                    const item = GameData.items.find(i => i.id === itemReward.id);
                    if (item) {
                        DataManager.addItemToInventory(item, itemReward.quantity);
                        UI.addToGameLog(`Obtained: ${item.name} x${itemReward.quantity}`, 'loot');
                    }
                });
            }
            
            return true;
        } catch (error) {
            console.error("Error giving reward:", error);
            return false;
        }
    },

    // Show redemption effects
    showRedemptionEffects: function(code) {
        // Gold glow effect
        if (code.includes("GOLD") || code.includes("START")) {
            const goldDisplay = document.querySelector('.gold-display');
            if (goldDisplay) {
                goldDisplay.classList.add('gold-glow');
                setTimeout(() => {
                    goldDisplay.classList.remove('gold-glow');
                }, 2000);
            }
        }
        
        // Level up effect for XP codes
        if (code.includes("XP")) {
            const levelDisplay = document.getElementById('player-level');
            if (levelDisplay) {
                levelDisplay.classList.add('level-up-animation');
                setTimeout(() => {
                    levelDisplay.classList.remove('level-up-animation');
                }, 1000);
            }
        }
    },

    // Check if a feature is unlocked
    isFeatureUnlocked: function(feature) {
        return this.unlockedFeatures.includes(feature);
    },

    // Check if a code has been used
    isCodeUsed: function(code) {
        return this.usedCodes.includes(code.toUpperCase());
    },

    // Generate a new redeem code (for events, rewards, etc.)
    generateRedeemCode: function(type, data, options = {}) {
        // Generate random code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        
        for (let i = 0; i < 8; i++) {
            if (i === 4) code += "-";
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Add to redeem codes
        this.redeemCodes[code] = {
            type: type,
            ...data,
            hidden: options.hidden || false,
            oneTime: options.oneTime !== false,
            expires: options.expires
        };
        
        return code;
    },

    // Get list of available codes (for testing/development)
    getAvailableCodes: function() {
        const available = [];
        
        for (const code in this.redeemCodes) {
            const codeData = this.redeemCodes[code];
            
            // Skip hidden codes unless they're unlocked
            if (codeData.hidden && !this.isFeatureUnlocked("devMode")) {
                continue;
            }
            
            // Skip used one-time codes
            if (codeData.oneTime && this.usedCodes.includes(code)) {
                continue;
            }
            
            // Check expiration
            if (codeData.expires) {
                const expireDate = new Date(codeData.expires);
                if (Date.now() > expireDate.getTime()) {
                    continue;
                }
            }
            
            available.push({
                code: code,
                type: codeData.type,
                message: codeData.message,
                hidden: codeData.hidden
            });
        }
        
        return available;
    },

    // Reset all redeem codes (debug/development)
    resetRedeemCodes: function() {
        if (confirm("Reset all redeem codes? This will clear used codes and unlocked features.")) {
            this.usedCodes = [];
            this.unlockedFeatures = [];
            this.saveUsedCodes();
            this.saveUnlockedFeatures();
            UI.addToGameLog("Redeem codes reset.", 'system');
        }
    },

    // Show redeem code list (for testing)
    showCodeList: function() {
        const available = this.getAvailableCodes();
        
        if (available.length === 0) {
            UI.addToGameLog("No redeem codes available.", 'system');
            return;
        }
        
        let message = "Available redeem codes:\n";
        available.forEach(code => {
            message += `\n${code.code}: ${code.message}`;
        });
        
        UI.addToGameLog(message, 'system');
    },

    // Check for auto-unlock features based on game progress
    checkAutoUnlocks: function() {
        const player = DataManager.gameState.player;
        
        // Unlock auto-battle after reaching level 10
        if (player.level >= 10 && !this.isFeatureUnlocked("autoBattle")) {
            this.unlockFeature("autoBattle");
            UI.addToGameLog("Auto Battle unlocked! You can now enable auto combat.", 'system');
        }
        
        // Unlock hidden races after defeating 50 monsters
        const defeatedCount = DataManager.gameState.monsters.defeated.length;
        if (defeatedCount >= 50 && !this.isFeatureUnlocked("hiddenRaces")) {
            this.unlockFeature("hiddenRaces");
            UI.addToGameLog("Hidden races discovered through your combat prowess!", 'system');
        }
        
        // Unlock hidden classes after completing 10 quests
        if (window.QuestSystem) {
            const questStats = QuestSystem.getQuestStats();
            if (questStats.completed >= 10 && !this.isFeatureUnlocked("hiddenClasses")) {
                this.unlockFeature("hiddenClasses");
                UI.addToGameLog("Hidden classes revealed through your questing experience!", 'system');
            }
        }
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.RedeemSystem = RedeemSystem;
}
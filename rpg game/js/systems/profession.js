// js/systems/profession.js
/**
 * Profession System - Handles all profession-related activities
 */

const ProfessionSystem = {
    // Profession definitions
    professions: {
        mining: {
            name: "Mining",
            icon: "fas fa-gem",
            description: "Mine ores and minerals",
            baseTime: 5000,
            baseExp: 10,
            requirements: { level: 1 },
            drops: [
                { itemId: "copper_ore", chance: 60, min: 1, max: 3 },
                { itemId: "tin_ore", chance: 30, min: 1, max: 2 },
                { itemId: "iron_ore", chance: 10, min: 1, max: 1 },
                { itemId: "coal", chance: 20, min: 1, max: 2 },
                { itemId: "gemstone", chance: 5, min: 1, max: 1 }
            ]
        },
        foraging: {
            name: "Foraging",
            icon: "fas fa-leaf",
            description: "Gather herbs and plants",
            baseTime: 4000,
            baseExp: 8,
            requirements: { level: 1 },
            drops: [
                { itemId: "herb", chance: 70, min: 1, max: 4 },
                { itemId: "berries", chance: 50, min: 2, max: 5 },
                { itemId: "mushroom", chance: 30, min: 1, max: 3 },
                { itemId: "rare_herb", chance: 5, min: 1, max: 1 }
            ]
        },
        lumberjack: {
            name: "Lumberjack",
            icon: "fas fa-tree",
            description: "Chop trees for wood",
            baseTime: 6000,
            baseExp: 12,
            requirements: { level: 1 },
            drops: [
                { itemId: "wood", chance: 80, min: 2, max: 5 },
                { itemId: "oak_wood", chance: 30, min: 1, max: 3 },
                { itemId: "maple_wood", chance: 10, min: 1, max: 2 },
                { itemId: "ancient_bark", chance: 2, min: 1, max: 1 }
            ]
        },
        hunting: {
            name: "Hunting",
            icon: "fas fa-paw",
            description: "Hunt animals for resources",
            baseTime: 8000,
            baseExp: 15,
            requirements: { level: 1 },
            drops: [
                { itemId: "meat", chance: 80, min: 1, max: 3 },
                { itemId: "hide", chance: 60, min: 1, max: 2 },
                { itemId: "bone", chance: 40, min: 1, max: 3 },
                { itemId: "rare_pelt", chance: 5, min: 1, max: 1 }
            ]
        },
        forging: {
            name: "Forging",
            icon: "fas fa-hammer",
            description: "Craft weapons and armor",
            baseTime: 10000,
            baseExp: 20,
            requirements: { level: 1, items: ["hammer"] },
            recipes: [
                {
                    id: "copper_sword",
                    name: "Copper Sword",
                    ingredients: [
                        { itemId: "copper_ore", quantity: 5 },
                        { itemId: "wood", quantity: 2 }
                    ],
                    result: { itemId: "copper_sword", quantity: 1 },
                    levelRequired: 1,
                    exp: 15
                },
                {
                    id: "iron_sword",
                    name: "Iron Sword",
                    ingredients: [
                        { itemId: "iron_ore", quantity: 10 },
                        { itemId: "coal", quantity: 3 },
                        { itemId: "wood", quantity: 3 }
                    ],
                    result: { itemId: "iron_sword", quantity: 1 },
                    levelRequired: 5,
                    exp: 30
                }
            ]
        },
        cooking: {
            name: "Cooking",
            icon: "fas fa-utensils",
            description: "Cook food for buffs",
            baseTime: 7000,
            baseExp: 15,
            requirements: { level: 1, items: ["cooking_pot"] },
            recipes: [
                {
                    id: "cooked_meat",
                    name: "Cooked Meat",
                    ingredients: [
                        { itemId: "meat", quantity: 2 }
                    ],
                    result: { itemId: "cooked_meat", quantity: 1 },
                    levelRequired: 1,
                    exp: 10,
                    buff: { hp: 20, duration: 300 }
                },
                {
                    id: "hearty_stew",
                    name: "Hearty Stew",
                    ingredients: [
                        { itemId: "meat", quantity: 3 },
                        { itemId: "herb", quantity: 2 },
                        { itemId: "berries", quantity: 2 }
                    ],
                    result: { itemId: "hearty_stew", quantity: 1 },
                    levelRequired: 3,
                    exp: 20,
                    buff: { hp: 50, atk: 5, duration: 600 }
                }
            ]
        }
    },

    // Activity state
    currentActivity: null,
    activityTimeout: null,
    activityProgress: 0,

    // Initialize profession system
    init: function() {
        console.log("Profession System initialized");
        this.loadProfessionData();
        this.bindEvents();
    },

    // Load profession data from JSON
    loadProfessionData: function() {
        // This would load from data/professions.json
        // For now, using hardcoded data above
    },

    // Bind event listeners
    bindEvents: function() {
        // Activity button click handlers
        document.getElementById('btn-mine').addEventListener('click', () => this.startActivity('mining'));
        document.getElementById('btn-forage').addEventListener('click', () => this.startActivity('foraging'));
        document.getElementById('btn-lumber').addEventListener('click', () => this.startActivity('lumberjack'));
        document.getElementById('btn-hunt').addEventListener('click', () => this.startActivity('hunting'));
        document.getElementById('btn-forge').addEventListener('click', () => this.showCraftingMenu('forging'));
        document.getElementById('btn-cook').addEventListener('click', () => this.showCraftingMenu('cooking'));
    },

    // Start an activity
    startActivity: function(professionId) {
        if (this.currentActivity) {
            UI.addToGameLog("You're already busy with another activity!", 'system');
            return;
        }

        const profession = this.professions[professionId];
        if (!profession) {
            UI.addToGameLog("Unknown profession", 'system');
            return;
        }

        // Check requirements
        if (!this.checkRequirements(profession)) {
            return;
        }

        this.currentActivity = professionId;
        const level = DataManager.getProfessionLevel(professionId);
        
        // Calculate time based on level
        const time = this.calculateActivityTime(profession.baseTime, level);
        
        UI.addToGameLog(`Started ${profession.name}...`, 'system');
        
        // Start progress
        this.activityProgress = 0;
        const interval = 100; // Update every 100ms
        const totalSteps = time / interval;
        const step = 100 / totalSteps;

        this.activityTimeout = setInterval(() => {
            this.activityProgress += step;
            if (this.activityProgress >= 100) {
                this.completeActivity(professionId);
            }
        }, interval / DataManager.getGameSpeed());
    },

    // Check activity requirements
    checkRequirements: function(profession) {
        const level = DataManager.getProfessionLevel(profession.name.toLowerCase());
        
        if (level < profession.requirements.level) {
            UI.addToGameLog(`You need ${profession.name} level ${profession.requirements.level} for this activity.`, 'system');
            return false;
        }

        if (profession.requirements.items) {
            for (const itemId of profession.requirements.items) {
                if (!DataManager.hasItem(itemId, 1)) {
                    const item = GameData.items.find(i => i.id === itemId);
                    UI.addToGameLog(`You need a ${item ? item.name : itemId} for this activity.`, 'system');
                    return false;
                }
            }
        }

        return true;
    },

    // Calculate activity time based on level
    calculateActivityTime: function(baseTime, level) {
        const reduction = Math.min(0.5, (level - 1) * 0.05); // 5% reduction per level, max 50%
        return baseTime * (1 - reduction);
    },

    // Complete an activity
    completeActivity: function(professionId) {
        if (this.activityTimeout) {
            clearInterval(this.activityTimeout);
            this.activityTimeout = null;
        }

        const profession = this.professions[professionId];
        const level = DataManager.getProfessionLevel(professionId);
        
        // Gain experience
        const expGained = Math.floor(profession.baseExp * (1 + (level - 1) * 0.1));
        DataManager.addProfessionExp(professionId, 1);
        
        // Get drops
        const drops = this.generateDrops(profession.drops, level);
        
        // Add drops to inventory
        drops.forEach(drop => {
            DataManager.addItemToInventory(drop.item, drop.quantity);
            UI.addToGameLog(`Found ${drop.quantity}x ${drop.item.name}!`, 'loot');
        });

        UI.addToGameLog(`Completed ${profession.name}! Gained ${expGained} XP.`, 'system');
        
        // Check for level up
        const newLevel = DataManager.getProfessionLevel(professionId);
        if (newLevel > level) {
            UI.addToGameLog(`${profession.name} skill increased to level ${newLevel}!`, 'system');
        }

        this.currentActivity = null;
        this.activityProgress = 0;
    },

    // Generate drops based on chance and level
    generateDrops: function(dropTable, level) {
        const drops = [];
        
        dropTable.forEach(drop => {
            // Increase chance with level
            const effectiveChance = Math.min(95, drop.chance + (level - 1));
            
            if (Utils.chance(effectiveChance)) {
                const item = GameData.items.find(i => i.id === drop.itemId);
                if (item) {
                    const quantity = Utils.randomInt(drop.min, drop.max);
                    drops.push({ item, quantity });
                }
            }
        });

        return drops;
    },

    // Show crafting menu
    showCraftingMenu: function(professionId) {
        const profession = this.professions[professionId];
        if (!profession || !profession.recipes) {
            UI.addToGameLog("No recipes available for this profession.", 'system');
            return;
        }

        // Create modal for crafting
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="${profession.icon}"></i> ${profession.name}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="recipes-list" id="recipes-list">
                        ${this.generateRecipesHTML(professionId)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add close event
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Add click events for recipes
        modal.querySelectorAll('.recipe-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const recipeId = e.currentTarget.dataset.recipeId;
                this.craftItem(professionId, recipeId);
                modal.remove();
            });
        });
    },

    // Generate recipes HTML
    generateRecipesHTML: function(professionId) {
        const profession = this.professions[professionId];
        const currentLevel = DataManager.getProfessionLevel(professionId);
        
        let html = '';
        profession.recipes.forEach(recipe => {
            const canCraft = this.canCraftRecipe(recipe);
            const hasLevel = currentLevel >= recipe.levelRequired;
            
            html += `
                <div class="recipe-item ${canCraft && hasLevel ? '' : 'disabled'}" 
                     data-recipe-id="${recipe.id}">
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-level">Level ${recipe.levelRequired}</div>
                    <div class="recipe-ingredients">
                        ${this.generateIngredientsHTML(recipe.ingredients)}
                    </div>
                    <div class="recipe-result">
                        Result: ${this.getItemName(recipe.result.itemId)} x${recipe.result.quantity}
                    </div>
                    ${!hasLevel ? '<div class="recipe-error">Level too low</div>' : ''}
                    ${!canCraft && hasLevel ? '<div class="recipe-error">Missing ingredients</div>' : ''}
                </div>
            `;
        });

        return html;
    },

    // Generate ingredients HTML
    generateIngredientsHTML: function(ingredients) {
        return ingredients.map(ing => {
            const hasItem = DataManager.hasItem(ing.itemId, ing.quantity);
            const itemName = this.getItemName(ing.itemId);
            return `
                <div class="ingredient ${hasItem ? 'has-item' : 'missing-item'}">
                    ${itemName} x${ing.quantity}
                </div>
            `;
        }).join('');
    },

    // Get item name by ID
    getItemName: function(itemId) {
        const item = GameData.items.find(i => i.id === itemId);
        return item ? item.name : itemId;
    },

    // Check if recipe can be crafted
    canCraftRecipe: function(recipe) {
        for (const ing of recipe.ingredients) {
            if (!DataManager.hasItem(ing.itemId, ing.quantity)) {
                return false;
            }
        }
        return true;
    },

    // Craft an item
    craftItem: function(professionId, recipeId) {
        const profession = this.professions[professionId];
        const recipe = profession.recipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            UI.addToGameLog("Recipe not found.", 'system');
            return;
        }

        // Check level
        const currentLevel = DataManager.getProfessionLevel(professionId);
        if (currentLevel < recipe.levelRequired) {
            UI.addToGameLog(`You need ${profession.name} level ${recipe.levelRequired} to craft this.`, 'system');
            return;
        }

        // Check ingredients
        if (!this.canCraftRecipe(recipe)) {
            UI.addToGameLog("You don't have all the required ingredients.", 'system');
            return;
        }

        // Remove ingredients
        recipe.ingredients.forEach(ing => {
            DataManager.removeItemFromInventory(ing.itemId, ing.quantity);
        });

        // Determine craft quality (rarity)
        const craftQuality = this.determineCraftQuality(professionId, currentLevel, recipe);
        const resultRarity = craftQuality.rarity;
        
        // Get base result
        const baseItem = GameData.items.find(i => i.id === recipe.result.itemId);
        if (!baseItem) {
            UI.addToGameLog("Result item not found.", 'system');
            return;
        }
        
        // Apply rarity
        const resultItem = RaritySystem.applyRarityToItem(baseItem, resultRarity);
        resultItem.quantity = recipe.result.quantity;
        
        // Add result to inventory
        DataManager.addItemToInventory(resultItem, resultItem.quantity);
        
        // Add profession experience with quality bonus
        let expGained = recipe.exp;
        if (resultRarity !== "common") {
            expGained *= RaritySystem.getRarityMultiplier(resultRarity);
        }
        DataManager.addProfessionExp(professionId, Math.floor(expGained));
        
        // Apply buff if exists
        if (recipe.buff) {
            this.applyBuff(recipe.buff, resultItem.name);
        }

        // Show result dengan warna rarity
        const rarityColor = RaritySystem.getRarityColor(resultRarity);
        UI.addToGameLog(
            `Crafted ${recipe.result.quantity}x <span style="color: ${rarityColor}">${resultItem.name}</span> (${craftQuality.name})!`, 
            'loot'
        );
        
        // Special message for high quality crafts
        if (resultRarity === "epic" || resultRarity === "legendary" || resultRarity === "mythic") {
            UI.addToGameLog(`Masterful craftsmanship! You created a ${resultRarity} quality item!`, 'system');
        }
        
        return true;
    },
    
    // Determine craft quality berdasarkan skill dan bahan
    determineCraftQuality: function(professionId, skillLevel, recipe) {
        const qualities = [
            { rarity: "common", chance: 40, name: "Normal Quality" },
            { rarity: "uncommon", chance: 30, name: "Good Quality" },
            { rarity: "rare", chance: 20, name: "Excellent Quality" },
            { rarity: "epic", chance: 8, name: "Masterpiece" },
            { rarity: "legendary", chance: 2, name: "Legendary Work" }
        ];
        
        // Adjust chances based on skill level
        let adjustedChances = qualities.map(quality => {
            let adjustedChance = quality.chance;
            
            // Higher skill increases chance for better quality
            if (quality.rarity !== "common") {
                adjustedChance += (skillLevel - recipe.levelRequired) * 2;
            } else {
                adjustedChance = Math.max(10, adjustedChance - (skillLevel - recipe.levelRequired) * 5);
            }
            
            return { ...quality, chance: adjustedChance };
        });
        
        // Check for rare ingredients
        const hasRareIngredients = recipe.ingredients.some(ing => {
            const item = GameData.items.find(i => i.id === ing.itemId);
            return item && item.rarity && item.rarity !== "common";
        });
        
        if (hasRareIngredients) {
            // Increase chances for higher quality
            adjustedChances = adjustedChances.map((quality, index) => {
                if (index > 0) { // Skip common
                    return { ...quality, chance: quality.chance * 1.5 };
                } else {
                    return { ...quality, chance: quality.chance * 0.5 };
                }
            });
        }
        
        // Select quality
        const totalChance = adjustedChances.reduce((sum, q) => sum + q.chance, 0);
        let random = Math.random() * totalChance;
        
        for (const quality of adjustedChances) {
            random -= quality.chance;
            if (random <= 0) {
                return quality;
            }
        }
        
        return qualities[0]; // Fallback to common
    },
    
    // Generate drops dengan rarity untuk gathering professions
    generateDrops: function(dropTable, level) {
        const drops = [];
        const dropChanceModifier = RaritySystem.getDropChanceModifier();
        
        dropTable.forEach(drop => {
            // Increase chance with level
            const effectiveChance = Math.min(95, drop.chance + (level - 1) + dropChanceModifier);
            
            if (Utils.chance(effectiveChance)) {
                const item = GameData.items.find(i => i.id === drop.itemId);
                if (item) {
                    const quantity = Utils.randomInt(drop.min, drop.max);
                    
                    // Apply rarity jika ada di drop table, atau generate random
                    const rarity = drop.rarity || RaritySystem.generateRandomRarity(dropChanceModifier);
                    const enhancedItem = RaritySystem.applyRarityToItem(item, rarity);
                    
                    drops.push({ item: enhancedItem, quantity, rarity });
                }
            }
        });

        return drops;
    },
    
    // Update completeActivity untuk menangani rarity drops
    completeActivity: function(professionId) {
        if (this.activityTimeout) {
            clearInterval(this.activityTimeout);
            this.activityTimeout = null;
        }

        const profession = this.professions[professionId];
        const level = DataManager.getProfessionLevel(professionId);
        
        // Gain experience
        const expGained = Math.floor(profession.baseExp * (1 + (level - 1) * 0.1));
        DataManager.addProfessionExp(professionId, 1);
        
        // Get drops
        const drops = this.generateDrops(profession.drops || [], level);
        
        // Add drops to inventory
        drops.forEach(drop => {
            DataManager.addItemToInventory(drop.item, drop.quantity);
            
            // Show rarity-colored message
            const rarityColor = RaritySystem.getRarityColor(drop.rarity);
            const rarityName = RaritySystem.getRarityName(drop.rarity);
            
            UI.addToGameLog(
                `Found ${drop.quantity}x <span style="color: ${rarityColor}">${drop.item.name}</span> (${rarityName})!`, 
                'loot'
            );
        });

        UI.addToGameLog(`Completed ${profession.name}! Gained ${expGained} XP.`, 'system');
        
        // Check for level up
        const newLevel = DataManager.getProfessionLevel(professionId);
        if (newLevel > level) {
            UI.addToGameLog(`${profession.name} skill increased to level ${newLevel}!`, 'system');
        }

        this.currentActivity = null;
        this.activityProgress = 0;
    },

    // Apply buff from cooked food
    applyBuff: function(buff, itemName) {
        const player = DataManager.gameState.player;
        
        // Initialize buffs array if not exists
        if (!player.buffs) player.buffs = [];
        
        const buffId = Utils.generateId();
        const buffEndTime = Date.now() + (buff.duration * 1000);
        
        player.buffs.push({
            id: buffId,
            type: 'food',
            source: itemName,
            stats: buff,
            expires: buffEndTime
        });

        // Apply immediate effects
        if (buff.hp) {
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + buff.hp);
            UI.addToGameLog(`Consumed ${itemName}: Restored ${buff.hp} HP`, 'system');
        }

        UI.updatePlayerInfo();
        
        // Remove buff after duration
        setTimeout(() => {
            this.removeBuff(buffId);
        }, buff.duration * 1000);
    },

    // Remove buff
    removeBuff: function(buffId) {
        const player = DataManager.gameState.player;
        if (!player.buffs) return;
        
        const buffIndex = player.buffs.findIndex(b => b.id === buffId);
        if (buffIndex > -1) {
            const buff = player.buffs[buffIndex];
            UI.addToGameLog(`${buff.source} buff has worn off.`, 'system');
            player.buffs.splice(buffIndex, 1);
        }
    },

    // Update buffs (called from game loop)
    updateBuffs: function() {
        const player = DataManager.gameState.player;
        if (!player.buffs) return;
        
        const now = Date.now();
        for (let i = player.buffs.length - 1; i >= 0; i--) {
            if (player.buffs[i].expires <= now) {
                player.buffs.splice(i, 1);
            }
        }
    },

    // Cancel current activity
    cancelActivity: function() {
        if (this.currentActivity && this.activityTimeout) {
            clearInterval(this.activityTimeout);
            this.currentActivity = null;
            this.activityProgress = 0;
            UI.addToGameLog("Activity cancelled.", 'system');
        }
    },

    // Get current profession level with bonuses
    getEffectiveLevel: function(professionId) {
        const baseLevel = DataManager.getProfessionLevel(professionId);
        let bonus = 0;
        
        // Check for equipment bonuses
        const player = DataManager.gameState.player;
        if (player.equipment) {
            // Check for profession boosting equipment
            // This would be implemented with a proper equipment system
        }
        
        return baseLevel + bonus;
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.ProfessionSystem = ProfessionSystem;
}
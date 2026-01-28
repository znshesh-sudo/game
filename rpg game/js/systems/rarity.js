// js/systems/rarity.js
/**
 * Rarity System - Handles all rarity-related mechanics
 */

const RaritySystem = {
    // Rarity definitions with colors, multipliers, and effects
    rarities: {
        common: {
            id: "common",
            name: "Common",
            color: "#808080",
            bgColor: "rgba(128, 128, 128, 0.1)",
            borderColor: "#808080",
            multiplier: 1.0,
            dropChance: 60,
            icon: "fas fa-circle",
            description: "Basic quality items"
        },
        uncommon: {
            id: "uncommon",
            name: "Uncommon",
            color: "#1eff00",
            bgColor: "rgba(30, 255, 0, 0.1)",
            borderColor: "#1eff00",
            multiplier: 1.3,
            dropChance: 25,
            icon: "fas fa-leaf",
            description: "Better than common items"
        },
        rare: {
            id: "rare",
            name: "Rare",
            color: "#0070dd",
            bgColor: "rgba(0, 112, 221, 0.1)",
            borderColor: "#0070dd",
            multiplier: 1.7,
            dropChance: 10,
            icon: "fas fa-gem",
            description: "Powerful and valuable items"
        },
        epic: {
            id: "epic",
            name: "Epic",
            color: "#a335ee",
            bgColor: "rgba(163, 53, 238, 0.1)",
            borderColor: "#a335ee",
            multiplier: 2.2,
            dropChance: 4,
            icon: "fas fa-fire",
            description: "Exceptionally powerful items"
        },
        legendary: {
            id: "legendary",
            name: "Legendary",
            color: "#ff8000",
            bgColor: "rgba(255, 128, 0, 0.1)",
            borderColor: "#ff8000",
            multiplier: 3.0,
            dropChance: 1,
            icon: "fas fa-crown",
            description: "Legendary artifacts of great power"
        },
        mythic: {
            id: "mythic",
            name: "Mythic",
            color: "#ff00ff",
            bgColor: "rgba(255, 0, 255, 0.1)",
            borderColor: "#ff00ff",
            multiplier: 4.0,
            dropChance: 0.1,
            icon: "fas fa-star",
            description: "Mythical items of immense power",
            glow: true
        },
        divine: {
            id: "divine",
            name: "Divine",
            color: "#00ffff",
            bgColor: "rgba(0, 255, 255, 0.1)",
            borderColor: "#00ffff",
            multiplier: 5.0,
            dropChance: 0.01,
            icon: "fas fa-globe",
            description: "Divine artifacts of godlike power",
            glow: true,
            animated: true
        }
    },

    // Rarity progression for items based on level
    levelRarityThresholds: {
        1: "common",
        10: "uncommon",
        20: "rare",
        30: "epic",
        40: "legendary",
        50: "mythic",
        60: "divine"
    },

    // Initialize rarity system
    init: function() {
        console.log("Rarity System initialized");
        this.bindEvents();
        this.loadRarityData();
    },

    // Load rarity data from storage
    loadRarityData: function() {
        const savedData = Utils.loadFromStorage('rarityStats');
        if (savedData) {
            this.playerStats = savedData;
        } else {
            this.playerStats = {
                itemsFound: {},
                highestRarity: "common",
                totalDrops: 0
            };
            for (const rarity in this.rarities) {
                this.playerStats.itemsFound[rarity] = 0;
            }
        }
    },

    // Save rarity data
    saveRarityData: function() {
        Utils.saveToStorage('rarityStats', this.playerStats);
    },

    // Bind event listeners
    bindEvents: function() {
        // Filter buttons for inventory
        this.createRarityFilters();
    },

    // Create rarity filter buttons
    createRarityFilters: function() {
        const inventorySection = document.querySelector('.inventory-section');
        if (!inventorySection) return;

        const filterContainer = document.createElement('div');
        filterContainer.className = 'rarity-filters';
        filterContainer.innerHTML = `
            <div class="filter-title">Filter by Rarity:</div>
            <div class="filter-buttons">
                <button class="filter-btn active" data-rarity="all">All</button>
                ${Object.values(this.rarities).map(rarity => `
                    <button class="filter-btn" data-rarity="${rarity.id}" style="color: ${rarity.color}; border-color: ${rarity.color};">
                        <i class="${rarity.icon}"></i> ${rarity.name}
                    </button>
                `).join('')}
            </div>
        `;

        inventorySection.insertBefore(filterContainer, inventorySection.querySelector('.inventory-items'));

        // Add click events
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rarity = e.target.dataset.rarity;
                this.filterInventoryByRarity(rarity);
                
                // Update active button
                filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // Filter inventory by rarity
    filterInventoryByRarity: function(rarity) {
        const inventory = DataManager.gameState.player.inventory;
        const container = document.getElementById('inventory-items');
        
        if (rarity === 'all') {
            UI.updateInventory();
            return;
        }

        // Clear container
        container.innerHTML = '';

        const filteredItems = inventory.filter(item => item.rarity === rarity);
        
        if (filteredItems.length === 0) {
            container.innerHTML = `<div class="empty-inventory">No ${rarity} items found</div>`;
            return;
        }

        // Display filtered items
        filteredItems.slice(0, 9).forEach(item => {
            const itemData = GameData.items.find(i => i.id === item.id) || item;
            const rarityData = this.rarities[item.rarity] || this.rarities.common;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.style.borderColor = rarityData.borderColor;
            itemElement.style.background = rarityData.bgColor;
            itemElement.innerHTML = `
                <div class="item-name" style="color: ${rarityData.color}">${itemData.name}</div>
                <div class="item-rarity" style="color: ${rarityData.color}">
                    <i class="${rarityData.icon}"></i> ${rarityData.name}
                </div>
                <div class="item-quantity">x${item.quantity}</div>
            `;
            
            itemElement.addEventListener('click', () => {
                UI.showItemDetails(itemData);
            });
            
            container.appendChild(itemElement);
        });
    },

    // Get rarity by ID
    getRarity: function(rarityId) {
        return this.rarities[rarityId] || this.rarities.common;
    },

    // Get rarity color
    getRarityColor: function(rarityId) {
        return this.getRarity(rarityId).color;
    },

    // Get rarity name
    getRarityName: function(rarityId) {
        return this.getRarity(rarityId).name;
    },

    // Determine rarity based on level
    getRarityByLevel: function(level) {
        let selectedRarity = "common";
        
        for (const [lvl, rarity] of Object.entries(this.levelRarityThresholds)) {
            if (level >= parseInt(lvl)) {
                selectedRarity = rarity;
            } else {
                break;
            }
        }
        
        return selectedRarity;
    },

    // Generate random rarity with chance
    generateRandomRarity: function(bonusChance = 0) {
        const chances = [];
        let totalWeight = 0;
        
        // Calculate effective chances with bonus
        for (const rarity of Object.values(this.rarities)) {
            let chance = rarity.dropChance;
            
            // Apply bonus chance (from luck stat, buffs, etc.)
            if (rarity.id !== "common") {
                chance += bonusChance;
            }
            
            chances.push({ rarity: rarity.id, chance });
            totalWeight += chance;
        }
        
        // Generate random rarity
        let random = Math.random() * totalWeight;
        for (const chance of chances) {
            random -= chance.chance;
            if (random <= 0) {
                return chance.rarity;
            }
        }
        
        return "common";
    },

    // Get rarity multiplier for stats
    getRarityMultiplier: function(rarityId) {
        return this.getRarity(rarityId).multiplier;
    },

    // Apply rarity to item stats
    applyRarityToItem: function(item, rarityId) {
        const rarity = this.getRarity(rarityId);
        const multiplier = rarity.multiplier;
        
        // Create enhanced item
        const enhancedItem = { ...item };
        enhancedItem.rarity = rarityId;
        
        // Apply multiplier to stats
        if (enhancedItem.stats) {
            for (const stat in enhancedItem.stats) {
                if (typeof enhancedItem.stats[stat] === 'number') {
                    enhancedItem.stats[stat] = Math.floor(enhancedItem.stats[stat] * multiplier);
                }
            }
        }
        
        // Increase value
        if (enhancedItem.value) {
            enhancedItem.value = Math.floor(enhancedItem.value * multiplier);
        }
        
        // Add rarity prefix to name
        enhancedItem.name = `${rarity.name} ${enhancedItem.name}`;
        
        // Update description
        enhancedItem.description = `${enhancedItem.description} (${rarity.name} Quality)`;
        
        return enhancedItem;
    },

    // Record item found
    recordItemFound: function(rarityId) {
        if (!this.playerStats) this.loadRarityData();
        
        this.playerStats.totalDrops++;
        this.playerStats.itemsFound[rarityId] = (this.playerStats.itemsFound[rarityId] || 0) + 1;
        
        // Update highest rarity
        const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine"];
        const currentIndex = rarityOrder.indexOf(this.playerStats.highestRarity);
        const newIndex = rarityOrder.indexOf(rarityId);
        
        if (newIndex > currentIndex) {
            this.playerStats.highestRarity = rarityId;
            
            // Unlock achievements for high rarity finds
            this.checkRarityAchievements(rarityId);
        }
        
        this.saveRarityData();
    },

    // Check rarity achievements
    checkRarityAchievements: function(rarityId) {
        const achievements = {
            "uncommon": { unlocked: false, reward: { gold: 50 } },
            "rare": { unlocked: false, reward: { gold: 200 } },
            "epic": { unlocked: false, reward: { gold: 500, exp: 100 } },
            "legendary": { unlocked: false, reward: { gold: 1000, exp: 500 } },
            "mythic": { unlocked: false, reward: { gold: 5000, exp: 1000 } },
            "divine": { unlocked: false, reward: { gold: 10000, exp: 5000 } }
        };
        
        if (achievements[rarityId] && !DataManager.isFeatureUnlocked(`${rarityId}_finder`)) {
            DataManager.unlockFeature(`${rarityId}_finder`);
            const reward = achievements[rarityId].reward;
            
            if (reward.gold) DataManager.addGold(reward.gold);
            if (reward.exp) DataManager.addExperience(reward.exp);
            
            UI.addToGameLog(`Achievement: Found your first ${rarityId} item!`, 'system');
            if (reward.gold) UI.addToGameLog(`Reward: ${reward.gold} Gold`, 'loot');
            if (reward.exp) UI.addToGameLog(`Reward: ${reward.exp} XP`, 'system');
        }
    },

    // Get player's rarity statistics
    getPlayerRarityStats: function() {
        if (!this.playerStats) this.loadRarityData();
        
        const stats = {
            totalItems: this.playerStats.totalDrops,
            highestRarity: this.playerStats.highestRarity,
            byRarity: { ...this.playerStats.itemsFound }
        };
        
        // Calculate percentages
        for (const rarity in stats.byRarity) {
            stats.byRarity[rarity] = {
                count: stats.byRarity[rarity],
                percentage: this.playerStats.totalDrops > 0 
                    ? ((stats.byRarity[rarity] / this.playerStats.totalDrops) * 100).toFixed(2)
                    : 0
            };
        }
        
        return stats;
    },

    // Show rarity statistics
    showRarityStats: function() {
        const stats = this.getPlayerRarityStats();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-bar"></i> Rarity Statistics</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="rarity-stats-summary">
                        <div class="stat-row">
                            <span class="stat-label">Total Items Found:</span>
                            <span class="stat-value">${stats.totalItems}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Highest Rarity:</span>
                            <span class="stat-value" style="color: ${this.getRarityColor(stats.highestRarity)}">
                                ${this.getRarityName(stats.highestRarity)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="rarity-breakdown">
                        <h3>Rarity Breakdown</h3>
                        <div class="rarity-bars">
                            ${Object.entries(stats.byRarity).map(([rarityId, data]) => {
                                const rarity = this.getRarity(rarityId);
                                const width = Math.min(100, (data.count / Math.max(1, stats.totalItems)) * 100 * 5);
                                return `
                                    <div class="rarity-bar-container">
                                        <div class="rarity-bar-label" style="color: ${rarity.color}">
                                            <i class="${rarity.icon}"></i> ${rarity.name}
                                        </div>
                                        <div class="rarity-bar">
                                            <div class="rarity-bar-fill" style="width: ${width}%; background: ${rarity.color}"></div>
                                        </div>
                                        <div class="rarity-bar-count">
                                            ${data.count} (${data.percentage}%)
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="rarity-info">
                        <h3>Rarity Information</h3>
                        <div class="rarity-info-grid">
                            ${Object.values(this.rarities).map(rarity => `
                                <div class="rarity-info-card" style="border-color: ${rarity.color}; background: ${rarity.bgColor}">
                                    <div class="rarity-info-header" style="color: ${rarity.color}">
                                        <i class="${rarity.icon}"></i> ${rarity.name}
                                    </div>
                                    <div class="rarity-info-desc">${rarity.description}</div>
                                    <div class="rarity-info-stats">
                                        <div>Multiplier: ${rarity.multiplier}x</div>
                                        <div>Drop Chance: ${rarity.dropChance}%</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close event
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
    },

    // Enhance item rarity (upgrade system)
    enhanceRarity: function(item, successChance = 50) {
        const currentRarity = item.rarity || "common";
        const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "divine"];
        const currentIndex = rarityOrder.indexOf(currentRarity);
        
        if (currentIndex >= rarityOrder.length - 1) {
            UI.addToGameLog("Item is already at maximum rarity!", 'system');
            return null;
        }
        
        const success = Utils.chance(successChance);
        
        if (success) {
            const newRarity = rarityOrder[currentIndex + 1];
            const enhancedItem = this.applyRarityToItem(item, newRarity);
            
            UI.addToGameLog(`Successfully enhanced ${item.name} to ${newRarity} quality!`, 'system');
            return enhancedItem;
        } else {
            // Chance to downgrade on failure
            if (Utils.chance(30) && currentIndex > 0) {
                const newRarity = rarityOrder[currentIndex - 1];
                const degradedItem = this.applyRarityToItem(item, newRarity);
                
                UI.addToGameLog(`Enhancement failed! ${item.name} degraded to ${newRarity} quality.`, 'system');
                return degradedItem;
            } else {
                UI.addToGameLog(`Enhancement failed! ${item.name} was not affected.`, 'system');
                return item;
            }
        }
    },

    // Calculate drop chance modifier based on player stats
    getDropChanceModifier: function() {
        const player = DataManager.gameState.player;
        let modifier = 0;
        
        // Luck stat increases drop chance
        if (player.stats.luck) {
            modifier += player.stats.luck * 0.1;
        }
        
        // Dungeon floor increases drop chance
        const dungeonFloor = DataManager.getDungeonFloor();
        modifier += (dungeonFloor - 1) * 0.05;
        
        // Profession levels increase drop chance
        const miningLevel = DataManager.getProfessionLevel('mining');
        modifier += miningLevel * 0.01;
        
        return modifier;
    },

    // Generate item with random rarity
    generateRandomItem: function(itemType, baseLevel = 1) {
        const itemsOfType = GameData.items.filter(item => item.type === itemType);
        
        if (itemsOfType.length === 0) {
            console.error(`No items found for type: ${itemType}`);
            return null;
        }
        
        // Select random base item
        const baseItem = Utils.deepClone(itemsOfType[Utils.randomInt(0, itemsOfType.length - 1)]);
        
        // Determine rarity
        const dropChanceModifier = this.getDropChanceModifier();
        const rarity = this.generateRandomRarity(dropChanceModifier);
        
        // Apply rarity
        const enhancedItem = this.applyRarityToItem(baseItem, rarity);
        
        // Record the find
        this.recordItemFound(rarity);
        
        return enhancedItem;
    },

    // Create rarity badge HTML
    createRarityBadge: function(rarityId) {
        const rarity = this.getRarity(rarityId);
        return `
            <span class="rarity-badge" style="color: ${rarity.color}; border-color: ${rarity.color}; background: ${rarity.bgColor}">
                <i class="${rarity.icon}"></i> ${rarity.name}
            </span>
        `;
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.RaritySystem = RaritySystem;
}
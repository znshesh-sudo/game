// js/systems/shop.js
/**
 * Shop System - Handles buying, selling, and shopping mechanics
 */

const ShopSystem = {
    // Shop inventory data
    shops: {
        general: {
            name: "General Store",
            icon: "fas fa-store",
            inventory: [
                { itemId: "small_potion", price: 10, stock: 20, restockRate: 5 },
                { itemId: "medium_potion", price: 25, stock: 10, restockRate: 3 },
                { itemId: "antidote", price: 15, stock: 10, restockRate: 2 },
                { itemId: "bandage", price: 5, stock: 30, restockRate: 10 },
                { itemId: "torch", price: 8, stock: 15, restockRate: 5 }
            ],
            buyRate: 1.0, // Price multiplier for buying
            sellRate: 0.6 // Price multiplier for selling
        },
        blacksmith: {
            name: "Blacksmith",
            icon: "fas fa-hammer",
            inventory: [
                { itemId: "copper_sword", price: 100, stock: 5, restockRate: 1 },
                { itemId: "iron_sword", price: 250, stock: 3, restockRate: 1 },
                { itemId: "steel_sword", price: 500, stock: 1, restockRate: 1 },
                { itemId: "leather_armor", price: 80, stock: 5, restockRate: 1 },
                { itemId: "chainmail", price: 200, stock: 2, restockRate: 1 },
                { itemId: "hammer", price: 50, stock: 10, restockRate: 2 }
            ],
            buyRate: 1.2,
            sellRate: 0.5
        },
        alchemist: {
            name: "Alchemist",
            icon: "fas fa-flask",
            inventory: [
                { itemId: "mana_potion", price: 30, stock: 10, restockRate: 3 },
                { itemId: "strength_potion", price: 50, stock: 5, restockRate: 2 },
                { itemId: "speed_potion", price: 40, stock: 5, restockRate: 2 },
                { itemId: "invisibility_potion", price: 100, stock: 2, restockRate: 1 },
                { itemId: "poison", price: 25, stock: 8, restockRate: 4 }
            ],
            buyRate: 1.3,
            sellRate: 0.4
        }
    },

    // Current shop state
    currentShop: null,
    shopModal: null,

    // Initialize shop system
    init: function() {
        console.log("Shop System initialized");
        this.loadShopData();
        this.bindEvents();
    },

    // Load shop data from storage
    loadShopData: function() {
        const savedShops = Utils.loadFromStorage('eternalRealmsShops');
        if (savedShops) {
            // Merge with defaults
            for (const shopId in savedShops) {
                if (this.shops[shopId]) {
                    this.shops[shopId].inventory = savedShops[shopId].inventory;
                }
            }
        }
    },

    // Save shop data
    saveShopData: function() {
        const shopData = {};
        for (const shopId in this.shops) {
            shopData[shopId] = {
                inventory: this.shops[shopId].inventory
            };
        }
        Utils.saveToStorage('eternalRealmsShops', shopData);
    },

    // Bind event listeners
    bindEvents: function() {
        document.getElementById('btn-buy-items').addEventListener('click', () => this.showShop('general'));
        document.getElementById('btn-sell-items').addEventListener('click', () => this.showSellInterface());
        document.getElementById('btn-buy-equipment').addEventListener('click', () => this.showShop('blacksmith'));
    },

    // Show shop interface
    showShop: function(shopId) {
        const shop = this.shops[shopId];
        if (!shop) {
            UI.addToGameLog("Shop not found.", 'system');
            return;
        }

        this.currentShop = shopId;
        this.createShopModal(shop, 'buy');
    },

    // Create shop modal
    createShopModal: function(shop, mode) {
        // Remove existing modal
        if (this.shopModal) {
            this.shopModal.remove();
        }

        // Create new modal
        this.shopModal = document.createElement('div');
        this.shopModal.className = 'modal active';
        this.shopModal.innerHTML = `
            <div class="modal-content shop-modal">
                <div class="modal-header">
                    <h2><i class="${shop.icon}"></i> ${shop.name}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shop-tabs">
                        <button class="shop-tab active" data-tab="buy">Buy</button>
                        <button class="shop-tab" data-tab="sell">Sell</button>
                    </div>
                    <div class="shop-content">
                        <div class="shop-items" id="shop-items">
                            ${mode === 'buy' ? this.generateBuyItemsHTML(shop) : this.generateSellItemsHTML()}
                        </div>
                        <div class="shop-player-info">
                            <div class="player-gold">
                                <i class="fas fa-coins"></i> Gold: <span id="shop-gold-amount">${DataManager.gameState.player.gold}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.shopModal);

        // Add event listeners
        this.shopModal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeShop();
        });

        // Tab switching
        this.shopModal.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchShopTab(tabId);
            });
        });

        // Buy/Sell item clicks
        this.shopModal.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const quantity = parseInt(e.currentTarget.dataset.quantity) || 1;
                
                if (mode === 'buy') {
                    this.buyItem(itemId, quantity);
                } else {
                    this.sellItem(itemId, quantity);
                }
            });
        });

        // Quantity controls
        this.shopModal.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemElement = e.target.closest('.shop-item');
                const itemId = itemElement.dataset.itemId;
                const isIncrease = e.target.classList.contains('increase');
                
                this.updateItemQuantity(itemId, isIncrease);
            });
        });
    },

    // Generate buy items HTML dengan rarity display
    generateBuyItemsHTML: function(shop) {
        let html = '';
        
        shop.inventory.forEach(shopItem => {
            const itemData = GameData.items.find(i => i.id === shopItem.itemId);
            if (!itemData) return;
            
            // Apply rarity dari shop item atau gunakan item default
            const rarity = shopItem.rarity || itemData.rarity || "common";
            const rarityData = RaritySystem.getRarity(rarity);
            const price = Math.floor(itemData.value * shop.buyRate * RaritySystem.getRarityMultiplier(rarity));
            const canAfford = DataManager.gameState.player.gold >= price;
            
            html += `
                <div class="shop-item ${canAfford ? '' : 'cannot-afford'}" 
                     data-item-id="${shopItem.itemId}"
                     style="border-color: ${rarityData.borderColor}; background: ${rarityData.bgColor}">
                    <div class="item-icon" style="color: ${rarityData.color}">
                        <i class="${itemData.icon || 'fas fa-question'}"></i>
                    </div>
                    <div class="item-info">
                        <div class="item-name" style="color: ${rarityData.color}">${itemData.name}</div>
                        <div class="item-rarity" style="color: ${rarityData.color}">
                            <i class="${rarityData.icon}"></i> ${rarityData.name}
                        </div>
                        <div class="item-description">${itemData.description || ''}</div>
                        <div class="item-stock">Stock: ${shopItem.stock}</div>
                    </div>
                    <div class="item-price">
                        <div class="price-amount">${price} <i class="fas fa-coins"></i></div>
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease">-</button>
                            <span class="quantity-display">1</span>
                            <button class="quantity-btn increase">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html || '<div class="no-items">No items available for purchase.</div>';
    },
    
    // Generate sell items HTML dengan rarity display
    generateSellItemsHTML: function() {
        const inventory = DataManager.gameState.player.inventory;
        if (inventory.length === 0) {
            return '<div class="no-items">No items to sell.</div>';
        }
        
        let html = '';
        const shop = this.shops[this.currentShop] || this.shops.general;
        
        inventory.forEach(invItem => {
            const itemData = GameData.items.find(i => i.id === invItem.id) || invItem;
            const rarity = invItem.rarity || itemData.rarity || "common";
            const rarityData = RaritySystem.getRarity(rarity);
            
            const sellPrice = Math.floor(itemData.value * shop.sellRate * RaritySystem.getRarityMultiplier(rarity));
            
            html += `
                <div class="shop-item" 
                     data-item-id="${invItem.id}" 
                     data-quantity="${invItem.quantity}"
                     style="border-color: ${rarityData.borderColor}; background: ${rarityData.bgColor}">
                    <div class="item-icon" style="color: ${rarityData.color}">
                        <i class="${itemData.icon || 'fas fa-question'}"></i>
                    </div>
                    <div class="item-info">
                        <div class="item-name" style="color: ${rarityData.color}">${itemData.name}</div>
                        <div class="item-rarity" style="color: ${rarityData.color}">
                            <i class="${rarityData.icon}"></i> ${rarityData.name}
                        </div>
                        <div class="item-description">${itemData.description || ''}</div>
                        <div class="item-stock">You have: ${invItem.quantity}</div>
                    </div>
                    <div class="item-price">
                        <div class="price-amount">${sellPrice} <i class="fas fa-coins"></i></div>
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease">-</button>
                            <span class="quantity-display">1</span>
                            <button class="quantity-btn increase">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    },
    
    // Buy item dengan rarity pricing
    buyItem: function(itemId, quantity = 1) {
        const shop = this.shops[this.currentShop];
        if (!shop) return false;
        
        const shopItem = shop.inventory.find(item => item.itemId === itemId);
        if (!shopItem) {
            UI.addToGameLog("Item not found in shop.", 'system');
            return false;
        }
        
        if (shopItem.stock < quantity) {
            UI.addToGameLog(`Not enough stock. Only ${shopItem.stock} available.`, 'system');
            return false;
        }
        
        const itemData = GameData.items.find(i => i.id === itemId);
        if (!itemData) {
            UI.addToGameLog("Item data not found.", 'system');
            return false;
        }
        
        // Calculate price with rarity multiplier
        const rarity = shopItem.rarity || itemData.rarity || "common";
        const rarityMultiplier = RaritySystem.getRarityMultiplier(rarity);
        const price = Math.floor(itemData.value * shop.buyRate * rarityMultiplier) * quantity;
        
        // Check if player has enough gold
        if (!DataManager.removeGold(price)) {
            UI.addToGameLog(`Not enough gold. You need ${price} gold.`, 'system');
            return false;
        }
        
        // Add item to inventory dengan rarity
        const enhancedItem = { ...itemData };
        enhancedItem.rarity = rarity;
        if (rarity !== "common") {
            enhancedItem.name = `${RaritySystem.getRarityName(rarity)} ${enhancedItem.name}`;
        }
        
        DataManager.addItemToInventory(enhancedItem, quantity);
        
        // Update shop stock
        shopItem.stock -= quantity;
        
        // Save shop data
        this.saveShopData();
        
        // Update UI
        UI.updatePlayerInfo();
        UI.updateInventory();
        this.updateShopGoldDisplay();
        
        // Show rarity-colored message
        const rarityColor = RaritySystem.getRarityColor(rarity);
        const rarityName = RaritySystem.getRarityName(rarity);
        
        UI.addToGameLog(
            `Bought ${quantity}x <span style="color: ${rarityColor}">${enhancedItem.name}</span> (${rarityName}) for ${price} gold.`, 
            'system'
        );
        
        return true;
    },
    
    // Sell item dengan rarity pricing
    sellItem: function(itemId, quantity = 1) {
        const shop = this.shops[this.currentShop] || this.shops.general;
        
        // Check if player has the item
        if (!DataManager.hasItem(itemId, quantity)) {
            UI.addToGameLog(`You don't have ${quantity} of that item.`, 'system');
            return false;
        }
        
        const inventoryItem = DataManager.gameState.player.inventory.find(i => i.id === itemId);
        const itemData = GameData.items.find(i => i.id === itemId) || inventoryItem;
        if (!itemData) {
            UI.addToGameLog("Item data not found.", 'system');
            return false;
        }
        
        // Calculate sell price with rarity multiplier
        const rarity = inventoryItem.rarity || itemData.rarity || "common";
        const rarityMultiplier = RaritySystem.getRarityMultiplier(rarity);
        const sellPrice = Math.floor(itemData.value * shop.sellRate * rarityMultiplier) * quantity;
        
        // Remove item from inventory
        DataManager.removeItemFromInventory(itemId, quantity);
        
        // Add gold
        DataManager.addGold(sellPrice);
        
        // Update shop stock (restock)
        let shopItem = shop.inventory.find(item => item.itemId === itemId);
        if (shopItem) {
            shopItem.stock += quantity;
        } else {
            // Add to shop inventory if not already there
            shop.inventory.push({
                itemId: itemId,
                rarity: rarity,
                price: Math.floor(itemData.value * shop.buyRate * rarityMultiplier),
                stock: quantity,
                restockRate: 1
            });
        }
        
        // Save shop data
        this.saveShopData();
        
        // Update UI
        UI.updatePlayerInfo();
        UI.updateInventory();
        this.updateShopGoldDisplay();
        
        // Update sell interface
        const currentTab = this.shopModal.querySelector('.shop-tab.active');
        if (currentTab && currentTab.dataset.tab === 'sell') {
            this.switchShopTab('sell');
        }
        
        // Show rarity-colored message
        const rarityColor = RaritySystem.getRarityColor(rarity);
        const rarityName = RaritySystem.getRarityName(rarity);
        
        UI.addToGameLog(
            `Sold ${quantity}x <span style="color: ${rarityColor}">${itemData.name}</span> (${rarityName}) for ${sellPrice} gold.`, 
            'system'
        );
        
        return true;
    },

    // Switch shop tab
    switchShopTab: function(tabId) {
        const shop = this.shops[this.currentShop];
        if (!shop) return;
        
        // Update active tab
        this.shopModal.querySelectorAll('.shop-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Update content
        const itemsContainer = this.shopModal.querySelector('#shop-items');
        if (tabId === 'buy') {
            itemsContainer.innerHTML = this.generateBuyItemsHTML(shop);
        } else {
            itemsContainer.innerHTML = this.generateSellItemsHTML();
        }
        
        // Rebind event listeners
        this.shopModal.querySelectorAll('.shop-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const quantity = parseInt(e.currentTarget.querySelector('.quantity-display').textContent);
                
                if (tabId === 'buy') {
                    this.buyItem(itemId, quantity);
                } else {
                    this.sellItem(itemId, quantity);
                }
            });
        });
        
        // Rebind quantity controls
        this.shopModal.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemElement = e.target.closest('.shop-item');
                const itemId = itemElement.dataset.itemId;
                const isIncrease = e.target.classList.contains('increase');
                
                this.updateItemQuantity(itemId, isIncrease);
            });
        });
    },

    // Update item quantity in shop
    updateItemQuantity: function(itemId, isIncrease) {
        const itemElement = this.shopModal.querySelector(`.shop-item[data-item-id="${itemId}"]`);
        if (!itemElement) return;
        
        const quantityDisplay = itemElement.querySelector('.quantity-display');
        let quantity = parseInt(quantityDisplay.textContent);
        const maxQuantity = parseInt(itemElement.dataset.quantity) || 99;
        
        if (isIncrease) {
            quantity = Math.min(quantity + 1, maxQuantity);
        } else {
            quantity = Math.max(1, quantity - 1);
        }
        
        quantityDisplay.textContent = quantity;
        itemElement.dataset.quantity = quantity;
    },

    // Buy an item
    buyItem: function(itemId, quantity = 1) {
        const shop = this.shops[this.currentShop];
        if (!shop) return false;
        
        const shopItem = shop.inventory.find(item => item.itemId === itemId);
        if (!shopItem) {
            UI.addToGameLog("Item not found in shop.", 'system');
            return false;
        }
        
        if (shopItem.stock < quantity) {
            UI.addToGameLog(`Not enough stock. Only ${shopItem.stock} available.`, 'system');
            return false;
        }
        
        const itemData = GameData.items.find(i => i.id === itemId);
        if (!itemData) {
            UI.addToGameLog("Item data not found.", 'system');
            return false;
        }
        
        const price = Math.floor(itemData.value * shop.buyRate) * quantity;
        
        // Check if player has enough gold
        if (!DataManager.removeGold(price)) {
            UI.addToGameLog(`Not enough gold. You need ${price} gold.`, 'system');
            return false;
        }
        
        // Add item to inventory
        DataManager.addItemToInventory(itemData, quantity);
        
        // Update shop stock
        shopItem.stock -= quantity;
        
        // Save shop data
        this.saveShopData();
        
        // Update UI
        UI.updatePlayerInfo();
        UI.updateInventory();
        this.updateShopGoldDisplay();
        
        UI.addToGameLog(`Bought ${quantity}x ${itemData.name} for ${price} gold.`, 'system');
        return true;
    },

    // Sell an item
    sellItem: function(itemId, quantity = 1) {
        const shop = this.shops[this.currentShop] || this.shops.general;
        
        // Check if player has the item
        if (!DataManager.hasItem(itemId, quantity)) {
            UI.addToGameLog(`You don't have ${quantity} of that item.`, 'system');
            return false;
        }
        
        const itemData = GameData.items.find(i => i.id === itemId);
        if (!itemData) {
            UI.addToGameLog("Item data not found.", 'system');
            return false;
        }
        
        // Calculate sell price
        const sellPrice = Math.floor(itemData.value * shop.sellRate) * quantity;
        
        // Remove item from inventory
        DataManager.removeItemFromInventory(itemId, quantity);
        
        // Add gold
        DataManager.addGold(sellPrice);
        
        // Update shop stock (restock)
        let shopItem = shop.inventory.find(item => item.itemId === itemId);
        if (shopItem) {
            shopItem.stock += quantity;
        } else {
            // Add to shop inventory if not already there
            shop.inventory.push({
                itemId: itemId,
                price: Math.floor(itemData.value * shop.buyRate),
                stock: quantity,
                restockRate: 1
            });
        }
        
        // Save shop data
        this.saveShopData();
        
        // Update UI
        UI.updatePlayerInfo();
        UI.updateInventory();
        this.updateShopGoldDisplay();
        
        // Update sell interface
        const currentTab = this.shopModal.querySelector('.shop-tab.active');
        if (currentTab && currentTab.dataset.tab === 'sell') {
            this.switchShopTab('sell');
        }
        
        UI.addToGameLog(`Sold ${quantity}x ${itemData.name} for ${sellPrice} gold.`, 'system');
        return true;
    },

    // Update gold display in shop
    updateShopGoldDisplay: function() {
        const goldDisplay = this.shopModal.querySelector('#shop-gold-amount');
        if (goldDisplay) {
            goldDisplay.textContent = DataManager.gameState.player.gold;
        }
    },

    // Close shop
    closeShop: function() {
        if (this.shopModal) {
            this.shopModal.remove();
            this.shopModal = null;
        }
        this.currentShop = null;
    },

    // Show sell interface (simple version)
    showSellInterface: function() {
        this.currentShop = 'general';
        this.createShopModal(this.shops.general, 'sell');
    },

    // Restock shops (called periodically)
    restockShops: function() {
        let restocked = false;
        
        for (const shopId in this.shops) {
            const shop = this.shops[shopId];
            
            shop.inventory.forEach(shopItem => {
                if (shopItem.stock < shopItem.restockRate * 10) {
                    shopItem.stock += shopItem.restockRate;
                    restocked = true;
                }
            });
        }
        
        if (restocked) {
            this.saveShopData();
            // Only log if player is in town
            if (DataManager.getCurrentLocation() === 'town') {
                UI.addToGameLog("Shops have been restocked.", 'system');
            }
        }
    },

    // Get item price for buying
    getBuyPrice: function(itemId, shopId = 'general') {
        const shop = this.shops[shopId];
        if (!shop) return 0;
        
        const itemData = GameData.items.find(i => i.id === itemId);
        if (!itemData) return 0;
        
        return Math.floor(itemData.value * shop.buyRate);
    },

    // Get item price for selling
    getSellPrice: function(itemId, shopId = 'general') {
        const shop = this.shops[shopId];
        if (!shop) return 0;
        
        const itemData = GameData.items.find(i => i.id === itemId);
        if (!itemData) return 0;
        
        return Math.floor(itemData.value * shop.sellRate);
    },

    // Check if item is available in shop
    isItemAvailable: function(itemId, shopId) {
        const shop = this.shops[shopId];
        if (!shop) return false;
        
        const shopItem = shop.inventory.find(item => item.itemId === itemId);
        return shopItem && shopItem.stock > 0;
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.ShopSystem = ShopSystem;
}
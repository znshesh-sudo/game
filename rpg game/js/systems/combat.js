// js/systems/combat.js
/**
 * Combat System - Handles all combat-related logic
 */

const CombatSystem = {
    currentEnemy: null,
    isInCombat: false,
    autoBattle: false,
    combatInterval: null,
    
    init: function() {
        // Load combat data
        this.monsters = GameData.monsters || [];
        this.skills = GameData.skills || [];
    },
    
    // Start combat with a monster
    startCombat: function(monsterId) {
        const monsterData = this.monsters.find(m => m.id === monsterId);
        if (!monsterData) {
            console.error('Monster not found:', monsterId);
            return;
        }
        
        // Create enemy instance
        this.currentEnemy = {
            ...Utils.deepClone(monsterData),
            hp: monsterData.stats.hp,
            maxHp: monsterData.stats.hp
        };
        
        this.isInCombat = true;
        
        // Update UI
        UI.updateEnemyDisplay(this.currentEnemy);
        UI.addToGameLog(`A wild ${this.currentEnemy.name} appears!`, 'combat');
        
        // Start auto-battle if enabled
        if (this.autoBattle && DataManager.isFeatureUnlocked('autoBattle')) {
            this.startAutoBattle();
        }
    },
    
    // Player attack
    playerAttack: function() {
        if (!this.isInCombat || !this.currentEnemy) return;
        
        const player = DataManager.gameState.player;
        const playerStats = player.stats;
        
        // Calculate damage
        let damage = playerStats.atk;
        
        // Critical hit chance
        const isCritical = Utils.chance(playerStats.crit);
        if (isCritical) {
            damage *= (playerStats.critDamage / 100);
            UI.showCriticalHit();
            UI.addToGameLog('Critical hit!', 'combat');
        }
        
        // Apply enemy defense
        damage = Math.max(1, damage - (this.currentEnemy.stats.def / 2));
        damage = Math.floor(damage);
        
        // Apply damage
        this.currentEnemy.hp -= damage;
        this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp);
        
        // Update UI
        UI.updateEnemyDisplay(this.currentEnemy);
        UI.showDamageAnimation(this.currentEnemy);
        UI.addToGameLog(`You hit ${this.currentEnemy.name} for ${damage} damage!`, 'combat');
        
        // Check if enemy is defeated
        if (this.currentEnemy.hp <= 0) {
            this.defeatEnemy();
            return;
        }
        
        // Enemy attacks back
        this.enemyAttack();
    },
    
    // Enemy attack
    enemyAttack: function() {
        if (!this.currentEnemy) return;
        
        const player = DataManager.gameState.player;
        const enemyStats = this.currentEnemy.stats;
        
        // Calculate damage
        let damage = enemyStats.atk;
        
        // Apply player defense
        damage = Math.max(1, damage - (player.stats.def / 2));
        damage = Math.floor(damage);
        
        // Apply damage to player
        player.stats.hp -= damage;
        player.stats.hp = Math.max(0, player.stats.hp);
        
        // Update UI
        UI.updatePlayerInfo();
        UI.showDamageAnimation(player, true);
        UI.addToGameLog(`${this.currentEnemy.name} hits you for ${damage} damage!`, 'combat');
        
        // Check if player is defeated
        if (player.stats.hp <= 0) {
            this.playerDefeated();
        }
    },
    
    // Defeat enemy
    defeatEnemy: function() {
        const player = DataManager.gameState.player;
        const enemy = this.currentEnemy;
        
        // Calculate rewards
        const exp = enemy.exp;
        const gold = Utils.randomInt(enemy.gold[0], enemy.gold[1]);
        
        // Add rewards
        DataManager.addExperience(exp);
        DataManager.addGold(gold);
        
        // Drop items
        this.processDrops(enemy);
        
        // Add to defeated monsters
        DataManager.gameState.monsters.defeated.push(enemy.id);
        
        // Log victory
        UI.addToGameLog(`You defeated ${enemy.name}! Gained ${exp} XP and ${gold} Gold.`, 'combat');
        
        // End combat
        this.endCombat();
        
        // Check for hidden race unlock
        this.checkHiddenUnlocks();
    },
    
    // Process item drops
    // Process drops dengan rarity
    processDrops: function(enemy) {
        if (!enemy.drops) return;
        
        const dropChanceModifier = RaritySystem.getDropChanceModifier();
        let totalDrops = 0;
        
        enemy.drops.forEach(drop => {
            // Calculate effective chance dengan rarity consideration
            let effectiveChance = drop.chance;
            
            // Apply drop chance modifier
            effectiveChance += dropChanceModifier;
            
            // Rare enemies have better drops
            if (enemy.rarity) {
                const rarityMultiplier = RaritySystem.getRarityMultiplier(enemy.rarity);
                effectiveChance *= rarityMultiplier;
            }
            
            // Check if drop occurs
            if (Utils.chance(effectiveChance)) {
                const item = GameData.items.find(i => i.id === drop.itemId);
                if (item) {
                    // Apply rarity dari drop atau generate random
                    const dropRarity = drop.rarity || RaritySystem.generateRandomRarity(dropChanceModifier);
                    const enhancedItem = RaritySystem.applyRarityToItem(item, dropRarity);
                    
                    DataManager.addItemToInventory(enhancedItem, 1);
                    
                    // Get rarity color for message
                    const rarityColor = RaritySystem.getRarityColor(dropRarity);
                    const rarityName = RaritySystem.getRarityName(dropRarity);
                    
                    UI.addToGameLog(
                        `Obtained: <span style="color: ${rarityColor}">${enhancedItem.name}</span> (${rarityName})`, 
                        'loot'
                    );
                    
                    totalDrops++;
                    
                    // Special effect for high rarity drops
                    if (dropRarity === "legendary" || dropRarity === "mythic" || dropRarity === "divine") {
                        this.showRarityDropEffect(dropRarity, enhancedItem.name);
                    }
                }
            }
        });
        
        // Bonus drop chance jika tidak ada drop yang terjadi
        if (totalDrops === 0 && Utils.chance(30 + dropChanceModifier)) {
            // Guaranteed common drop
            const commonItems = GameData.items.filter(item => item.rarity === "common");
            if (commonItems.length > 0) {
                const randomItem = commonItems[Utils.randomInt(0, commonItems.length - 1)];
                DataManager.addItemToInventory(randomItem, 1);
                UI.addToGameLog(`Obtained: ${randomItem.name}`, 'loot');
            }
        }
    },
    
    // Show special effects for rare drops
    showRarityDropEffect: function(rarity, itemName) {
        const effects = {
            legendary: {
                color: "#ff8000",
                icon: "fas fa-crown",
                message: "LEGENDARY DROP!",
                sound: "legendary_drop"
            },
            mythic: {
                color: "#ff00ff",
                icon: "fas fa-star",
                message: "MYTHIC DROP!",
                sound: "mythic_drop"
            },
            divine: {
                color: "#00ffff",
                icon: "fas fa-globe",
                message: "DIVINE DROP!",
                sound: "divine_drop",
                glow: true
            }
        };
        
        const effect = effects[rarity];
        if (effect) {
            // Create notification
            const notification = document.createElement('div');
            notification.className = 'rarity-drop-notification';
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: ${effect.color};
                padding: 20px 40px;
                border: 3px solid ${effect.color};
                border-radius: 10px;
                font-size: 2rem;
                font-weight: bold;
                text-align: center;
                z-index: 10000;
                animation: rarityPulse 2s ease;
            `;
            
            notification.innerHTML = `
                <i class="${effect.icon}"></i><br>
                ${effect.message}<br>
                <span style="font-size: 1.5rem">${itemName}</span>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
            
            // Add to game log dengan styling khusus
            UI.addToGameLog(
                `<div style="color: ${effect.color}; font-weight: bold; text-align: center; padding: 10px; border: 2px solid ${effect.color}; background: rgba(0,0,0,0.5);">
                    <i class="${effect.icon}"></i> ${effect.message}: ${itemName}
                </div>`,
                'loot'
            );
        }
    },
    
    // Player defeated
    playerDefeated: function() {
        const player = DataManager.gameState.player;
        
        // Lose some gold (10%)
        const goldLost = Math.floor(player.gold * 0.1);
        player.gold -= goldLost;
        
        // Reset HP
        player.stats.hp = player.stats.maxHp;
        
        // Log defeat
        UI.addToGameLog(`You were defeated! Lost ${goldLost} Gold.`, 'combat');
        
        // End combat
        this.endCombat();
    },
    
    // Flee from combat
    fleeCombat: function() {
        if (!this.isInCombat) return;
        
        const success = Utils.chance(70); // 70% chance to flee
        
        if (success) {
            UI.addToGameLog('You successfully fled from combat!', 'combat');
            this.endCombat();
        } else {
            UI.addToGameLog('Failed to flee!', 'combat');
            this.enemyAttack();
        }
    },
    
    // End combat
    endCombat: function() {
        this.isInCombat = false;
        this.currentEnemy = null;
        this.stopAutoBattle();
        
        // Update UI
        UI.updateEnemyDisplay(null);
    },
    
    // Set auto-battle
    setAutoBattle: function(enabled) {
        this.autoBattle = enabled;
        
        if (enabled && this.isInCombat) {
            this.startAutoBattle();
        } else {
            this.stopAutoBattle();
        }
    },
    
    // Start auto-battle
    startAutoBattle: function() {
        if (this.combatInterval) return;
        
        this.combatInterval = setInterval(() => {
            if (this.isInCombat && this.currentEnemy) {
                this.playerAttack();
            } else {
                this.stopAutoBattle();
            }
        }, 1000 / DataManager.getGameSpeed());
    },
    
    // Stop auto-battle
    stopAutoBattle: function() {
        if (this.combatInterval) {
            clearInterval(this.combatInterval);
            this.combatInterval = null;
        }
    },
    
    // Check for hidden unlocks
    checkHiddenUnlocks: function() {
        const defeated = DataManager.gameState.monsters.defeated;
        const count = defeated.length;
        
        // Unlock hidden race after defeating 100 monsters
        if (count >= 100 && !DataManager.isFeatureUnlocked('hiddenRaces')) {
            DataManager.unlockFeature('hiddenRaces');
            UI.addToGameLog('Hidden races have been unlocked!', 'system');
        }
    }
};

if (typeof window !== 'undefined') {
    window.CombatSystem = CombatSystem;
}
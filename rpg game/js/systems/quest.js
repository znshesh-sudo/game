// js/systems/quest.js
/**
 * Quest System - Handles dynamic quest generation and tracking
 */

const QuestSystem = {
    // Quest templates for dynamic generation
    questTemplates: {
        hunting: {
            name: "Hunting Quest",
            types: ["slay", "collect", "hunt"],
            targets: ["goblins", "orcs", "wolves", "skeletons", "spiders"],
            locations: ["forest", "cave", "mountains", "swamp", "ruins"],
            rewards: { exp: [50, 200], gold: [20, 100], items: ["potion", "weapon", "armor"] }
        },
        gathering: {
            name: "Gathering Quest",
            types: ["collect", "gather", "find"],
            targets: ["herbs", "ores", "wood", "mushrooms", "flowers"],
            locations: ["forest", "mine", "meadow", "riverbank", "hills"],
            rewards: { exp: [30, 150], gold: [15, 80], items: ["material", "herb", "gem"] }
        },
        exploration: {
            name: "Exploration Quest",
            types: ["explore", "map", "discover"],
            targets: ["areas", "locations", "landmarks", "dungeons"],
            locations: ["unknown", "uncharted", "mysterious", "ancient"],
            rewards: { exp: [100, 300], gold: [50, 150], items: ["map", "artifact", "treasure"] }
        },
        delivery: {
            name: "Delivery Quest",
            types: ["deliver", "transport", "escort"],
            targets: ["package", "message", "supplies", "merchant"],
            locations: ["town", "village", "outpost", "castle"],
            rewards: { exp: [40, 120], gold: [30, 90], items: ["gold", "consumable"] }
        }
    },

    // Active quest data
    activeQuests: [],
    completedQuests: [],
    questLog: [],

    // Groq API configuration
    groqApiKey: null,
    useAIQuests: false,

    // Initialize quest system
    init: function() {
        console.log("Quest System initialized");
        this.loadQuestData();
        this.bindEvents();
        this.loadGroqApiKey();
    },

    // Load quest data from storage
    loadQuestData: function() {
        const savedQuests = Utils.loadFromStorage('eternalRealmsQuests');
        if (savedQuests) {
            this.activeQuests = savedQuests.activeQuests || [];
            this.completedQuests = savedQuests.completedQuests || [];
            this.questLog = savedQuests.questLog || [];
        }
    },

    // Save quest data
    saveQuestData: function() {
        const questData = {
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            questLog: this.questLog
        };
        Utils.saveToStorage('eternalRealmsQuests', questData);
    },

    // Bind event listeners
    bindEvents: function() {
        document.getElementById('btn-new-quest').addEventListener('click', () => this.generateNewQuest());
    },

    // Load Groq API key
    loadGroqApiKey: function() {
        this.groqApiKey = localStorage.getItem('groqApiKey');
        this.useAIQuests = !!this.groqApiKey;
    },

    // Set Groq API key
    setGroqApiKey: function(apiKey) {
        this.groqApiKey = apiKey;
        this.useAIQuests = true;
        localStorage.setItem('groqApiKey', apiKey);
        UI.addToGameLog("Groq API key set. AI quests enabled!", 'system');
    },

    // Generate a new quest
    generateNewQuest: function() {
        // Check if we should use AI
        if (this.useAIQuests && this.groqApiKey) {
            this.generateAIQuest();
        } else {
            this.generateTemplateQuest();
        }
    },

    // Generate quest from template
    generateTemplateQuest: function() {
        // Select random template
        const templateKeys = Object.keys(this.questTemplates);
        const randomKey = templateKeys[Utils.randomInt(0, templateKeys.length - 1)];
        const template = this.questTemplates[randomKey];

        // Generate quest details
        const type = template.types[Utils.randomInt(0, template.types.length - 1)];
        const target = template.targets[Utils.randomInt(0, template.targets.length - 1)];
        const location = template.locations[Utils.randomInt(0, template.locations.length - 1)];
        const count = Utils.randomInt(3, 10);
        
        // Generate description
        const descriptions = [
            `The locals need help. Please ${type} ${count} ${target} in the ${location}.`,
            `Rumors speak of ${target} causing trouble in the ${location}. Deal with ${count} of them.`,
            `I need someone to ${type} ${count} ${target}. The ${location} is where you'll find them.`,
            `${count} ${target} need to be taken care of in the ${location}. Will you help?`
        ];
        
        const description = descriptions[Utils.randomInt(0, descriptions.length - 1)];

        // Generate rewards
        const expReward = Utils.randomInt(template.rewards.exp[0], template.rewards.exp[1]) * (count / 5);
        const goldReward = Utils.randomInt(template.rewards.gold[0], template.rewards.gold[1]) * (count / 5);
        
        // Chance for item reward
        let itemReward = null;
        if (Utils.chance(30)) {
            const itemType = template.rewards.items[Utils.randomInt(0, template.rewards.items.length - 1)];
            const possibleItems = GameData.items.filter(item => item.type === itemType);
            if (possibleItems.length > 0) {
                itemReward = possibleItems[Utils.randomInt(0, possibleItems.length - 1)];
            }
        }

        // Create quest
        const quest = {
            id: Utils.generateId(),
            title: `${template.name}: ${Utils.capitalize(type)} the ${target}`,
            description: description,
            type: randomKey,
            objective: {
                action: type,
                target: target,
                count: count,
                current: 0,
                location: location
            },
            rewards: {
                exp: Math.floor(expReward),
                gold: Math.floor(goldReward),
                items: itemReward ? [{ id: itemReward.id, quantity: 1 }] : []
            },
            difficulty: this.calculateDifficulty(count, randomKey),
            generatedAt: new Date().toISOString(),
            timeLimit: 3600, // 1 hour in seconds
            startedAt: Date.now()
        };

        this.addQuest(quest);
    },

    // Generate AI-powered quest using Groq API
    async generateAIQuest() {
        try {
            UI.addToGameLog("Generating AI-powered quest...", 'system');
            
            const prompt = `
                Generate a unique fantasy RPG quest for a level ${DataManager.gameState.player.level} ${DataManager.gameState.player.race} ${DataManager.gameState.player.class}.
                
                Requirements:
                1. Create an engaging quest title
                2. Write a detailed quest description (2-3 sentences)
                3. Specify quest type (hunting, gathering, exploration, delivery, or story)
                4. Define objectives (what needs to be done)
                5. Set reasonable rewards (XP, gold, optional item)
                6. Make it thematic and interesting
                
                Format response as JSON:
                {
                    "title": "Quest Title",
                    "description": "Quest description here",
                    "type": "quest_type",
                    "objectives": [
                        {
                            "action": "kill/collect/explore/etc",
                            "target": "target_name",
                            "count": number,
                            "location": "location_name"
                        }
                    ],
                    "rewards": {
                        "exp": number,
                        "gold": number,
                        "items": ["optional_item_id"]
                    }
                }
            `;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a creative quest designer for a fantasy RPG game. Generate unique and engaging quests.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const aiQuest = JSON.parse(data.choices[0].message.content);

            // Format quest for our system
            const quest = {
                id: Utils.generateId(),
                title: aiQuest.title,
                description: aiQuest.description,
                type: aiQuest.type,
                objective: aiQuest.objectives[0], // Take first objective
                rewards: aiQuest.rewards,
                difficulty: 'medium',
                generatedAt: new Date().toISOString(),
                timeLimit: 7200, // 2 hours for AI quests
                startedAt: Date.now(),
                isAI: true
            };

            // Validate and fix quest data
            quest.objective.current = 0;
            if (!quest.objective.count) quest.objective.count = Utils.randomInt(3, 7);
            if (!quest.objective.location) quest.objective.location = this.getRandomLocation();
            
            this.addQuest(quest);
            UI.addToGameLog("AI quest generated successfully!", 'system');

        } catch (error) {
            console.error('Error generating AI quest:', error);
            UI.addToGameLog("Failed to generate AI quest. Using template instead.", 'system');
            this.generateTemplateQuest();
        }
    },

    // Get random location
    getRandomLocation: function() {
        const locations = ['forest', 'cave', 'mountains', 'dungeon', 'swamp', 'ruins', 'village', 'town'];
        return locations[Utils.randomInt(0, locations.length - 1)];
    },

    // Calculate quest difficulty
    calculateDifficulty: function(count, type) {
        const baseDiff = Math.min(5, Math.floor(count / 2));
        const typeBonus = { hunting: 1, exploration: 0, gathering: -1, delivery: -1 };
        const difficulty = baseDiff + (typeBonus[type] || 0);
        
        return ['very easy', 'easy', 'medium', 'hard', 'very hard', 'extreme'][Math.max(0, Math.min(5, difficulty))];
    },

    // Add a new quest
    addQuest: function(quest) {
        // Check for existing similar quest
        const existingQuest = this.activeQuests.find(q => 
            q.objective.target === quest.objective.target && 
            q.objective.action === quest.objective.action
        );
        
        if (existingQuest) {
            UI.addToGameLog("You already have a similar quest active.", 'system');
            return;
        }

        // Limit active quests
        if (this.activeQuests.length >= 5) {
            UI.addToGameLog("Quest log is full! Complete some quests first.", 'system');
            return;
        }

        this.activeQuests.push(quest);
        this.saveQuestData();
        
        UI.addToGameLog(`New Quest: ${quest.title}`, 'quest');
        UI.addToGameLog(quest.description, 'quest');
        UI.updateQuestDisplay();
    },

    // Update quest progress
    updateQuestProgress: function(action, target, amount = 1) {
        let updated = false;
        
        this.activeQuests.forEach(quest => {
            if (quest.objective.action === action && quest.objective.target === target) {
                quest.objective.current += amount;
                quest.objective.current = Math.min(quest.objective.current, quest.objective.count);
                updated = true;
                
                UI.addToGameLog(`Quest progress: ${quest.objective.current}/${quest.objective.count} ${target}`, 'quest');
                
                // Check if quest is complete
                if (quest.objective.current >= quest.objective.count) {
                    this.completeQuest(quest.id);
                }
            }
        });
        
        if (updated) {
            this.saveQuestData();
            UI.updateQuestDisplay();
        }
    },

    // Complete a quest
    completeQuest: function(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;
        
        const quest = this.activeQuests[questIndex];
        
        // Give rewards
        DataManager.addExperience(quest.rewards.exp);
        DataManager.addGold(quest.rewards.gold);
        
        // Give item rewards
        if (quest.rewards.items && quest.rewards.items.length > 0) {
            quest.rewards.items.forEach(itemReward => {
                const item = GameData.items.find(i => i.id === itemReward.id);
                if (item) {
                    DataManager.addItemToInventory(item, itemReward.quantity);
                    UI.addToGameLog(`Quest reward: ${item.name}`, 'loot');
                }
            });
        }
        
        // Move to completed quests
        this.activeQuests.splice(questIndex, 1);
        this.completedQuests.push({
            ...quest,
            completedAt: new Date().toISOString()
        });
        
        // Add to quest log
        this.questLog.push({
            title: quest.title,
            completedAt: new Date().toISOString(),
            rewards: quest.rewards
        });
        
        // Keep only last 50 quests in log
        if (this.questLog.length > 50) {
            this.questLog.shift();
        }
        
        this.saveQuestData();
        UI.updateQuestDisplay();
        
        UI.addToGameLog(`Quest Complete: ${quest.title}!`, 'quest');
        UI.addToGameLog(`Rewards: ${quest.rewards.exp} XP, ${quest.rewards.gold} Gold`, 'loot');
        
        // Check for achievements
        this.checkQuestAchievements();
    },

    // Abandon a quest
    abandonQuest: function(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex > -1) {
            const quest = this.activeQuests[questIndex];
            this.activeQuests.splice(questIndex, 1);
            this.saveQuestData();
            UI.updateQuestDisplay();
            UI.addToGameLog(`Abandoned quest: ${quest.title}`, 'system');
        }
    },

    // Check quest achievements
    checkQuestAchievements: function() {
        const totalCompleted = this.completedQuests.length;
        
        // Achievement for completing first quest
        if (totalCompleted === 1 && !DataManager.isFeatureUnlocked('firstQuest')) {
            DataManager.unlockFeature('firstQuest');
            UI.addToGameLog("Achievement Unlocked: First Quest!", 'system');
        }
        
        // Achievement for completing 10 quests
        if (totalCompleted === 10 && !DataManager.isFeatureUnlocked('questMaster')) {
            DataManager.unlockFeature('questMaster');
            DataManager.addGold(500);
            UI.addToGameLog("Achievement Unlocked: Quest Master! +500 Gold", 'system');
        }
        
        // Achievement for completing AI quest
        const aiQuest = this.completedQuests.find(q => q.isAI);
        if (aiQuest && !DataManager.isFeatureUnlocked('aiExplorer')) {
            DataManager.unlockFeature('aiExplorer');
            UI.addToGameLog("Achievement Unlocked: AI Explorer!", 'system');
        }
    },

    // Update quest display in UI
    updateQuestDisplay: function() {
        const questCard = document.getElementById('quest-card');
        const questTitle = document.getElementById('quest-title');
        const questDesc = document.getElementById('quest-desc');
        const questProgress = document.getElementById('quest-progress');
        const btnNewQuest = document.getElementById('btn-new-quest');
        
        if (this.activeQuests.length > 0) {
            const quest = this.activeQuests[0]; // Show first active quest
            questTitle.textContent = quest.title;
            questDesc.textContent = quest.description;
            
            // Update progress bar
            const progressPercent = (quest.objective.current / quest.objective.count) * 100;
            const progressFill = questProgress.querySelector('.progress-fill');
            progressFill.style.width = `${progressPercent}%`;
            
            // Update progress text
            const progressText = questProgress.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${quest.objective.current}/${quest.objective.count}`;
            } else {
                const text = document.createElement('div');
                text.className = 'progress-text';
                text.textContent = `${quest.objective.current}/${quest.objective.count}`;
                questProgress.appendChild(text);
            }
            
            // Update button
            btnNewQuest.innerHTML = '<i class="fas fa-times"></i> Abandon Quest';
            btnNewQuest.onclick = () => this.abandonQuest(quest.id);
        } else {
            questTitle.textContent = "No Active Quest";
            questDesc.textContent = "Generate a new quest or explore the world to find quests.";
            
            const progressFill = questProgress.querySelector('.progress-fill');
            progressFill.style.width = '0%';
            
            const progressText = questProgress.querySelector('.progress-text');
            if (progressText) progressText.remove();
            
            btnNewQuest.innerHTML = '<i class="fas fa-dice"></i> Generate Quest';
            btnNewQuest.onclick = () => this.generateNewQuest();
        }
    },

    // Get active quests
    getActiveQuests: function() {
        return this.activeQuests;
    },

    // Get quest statistics
    getQuestStats: function() {
        return {
            active: this.activeQuests.length,
            completed: this.completedQuests.length,
            totalRewards: {
                exp: this.completedQuests.reduce((sum, q) => sum + q.rewards.exp, 0),
                gold: this.completedQuests.reduce((sum, q) => sum + q.rewards.gold, 0)
            }
        };
    },

    // Check for expired quests
    checkExpiredQuests: function() {
        const now = Date.now();
        let expiredCount = 0;
        
        for (let i = this.activeQuests.length - 1; i >= 0; i--) {
            const quest = this.activeQuests[i];
            const elapsed = (now - quest.startedAt) / 1000;
            
            if (elapsed > quest.timeLimit) {
                this.activeQuests.splice(i, 1);
                expiredCount++;
                UI.addToGameLog(`Quest expired: ${quest.title}`, 'system');
            }
        }
        
        if (expiredCount > 0) {
            this.saveQuestData();
            UI.updateQuestDisplay();
        }
    }
};

// Initialize when loaded
if (typeof window !== 'undefined') {
    window.QuestSystem = QuestSystem;
}
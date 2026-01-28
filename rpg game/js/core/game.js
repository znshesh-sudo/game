// js/core/game.js
/**
 * Main Game File - Initializes all systems and starts the game
 */

// Global game data
const GameData = {};

// Main game initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('Eternal Realms RPG - Core Engine v1.0');
    
    // Initialize utility functions
    if (typeof Utils === 'undefined') {
        console.error('Utils.js not loaded!');
        return;
    }
    
    // Initialize data manager
    DataManager.init();
    
    // Load game data
    loadGameData().then(() => {
        console.log('Game data loaded successfully');
        
        // Initialize UI
        UI.init();
        
        // Initialize systems
        initializeSystems();
        
        // Start game loop
        startGameLoop();
        
        // Show welcome message
        UI.addToGameLog('Game initialized successfully. Welcome to Eternal Realms!', 'system');
    }).catch(error => {
        console.error('Failed to load game data:', error);
        UI.addToGameLog('Error loading game data. Please refresh the page.', 'system');
    });
});

// Load game data from JSON files
async function loadGameData() {
    try {
        // Load races
        const racesResponse = await fetch('data/races.json');
        GameData.races = (await racesResponse.json()).races;
        
        // Load classes
        const classesResponse = await fetch('data/classes.json');
        GameData.classes = (await classesResponse.json()).classes;
        
        // Load monsters
        const monstersResponse = await fetch('data/monsters.json');
        GameData.monsters = (await monstersResponse.json()).monsters;
        
        // Load items
        const itemsResponse = await fetch('data/items.json');
        GameData.items = (await itemsResponse.json()).items;
        
        // Load skills
        const skillsResponse = await fetch('data/skills.json');
        GameData.skills = (await skillsResponse.json()).skills;
        
        // Set default data if files not found
        setDefaultData();
        
    } catch (error) {
        console.warn('Using default game data:', error);
        setDefaultData();
    }
}

// Set default game data
function setDefaultData() {
    if (!GameData.races) {
        GameData.races = [
            { id: 'human', name: 'Human', description: 'Balanced and adaptable' },
            { id: 'elf', name: 'Elf', description: 'Agile with magical affinity' },
            { id: 'dwarf', name: 'Dwarf', description: 'Strong and resistant' }
        ];
    }
    
    if (!GameData.classes) {
        GameData.classes = [
            { id: 'warrior', name: 'Warrior', description: 'Master of melee combat' },
            { id: 'mage', name: 'Mage', description: 'Wielder of arcane magic' },
            { id: 'archer', name: 'Archer', description: 'Expert marksman' }
        ];
    }
    
    if (!GameData.monsters) {
        GameData.monsters = [
            {
                id: 'goblin',
                name: 'Goblin',
                level: 1,
                stats: { hp: 30, maxHp: 30, atk: 5, def: 2, spd: 4, crit: 5 },
                exp: 10,
                gold: [1, 5],
                drops: []
            }
        ];
    }
    
    if (!GameData.items) {
        GameData.items = [
            {
                id: 'small_potion',
                name: 'Small Health Potion',
                description: 'Restores 20 HP',
                type: 'consumable',
                value: 10,
                effect: { hp: 20 }
            },
            {
                id: 'leather_scrap',
                name: 'Leather Scrap',
                description: 'Used for crafting',
                type: 'material',
                value: 2
            }
        ];
    }
    
    if (!GameData.skills) {
        GameData.skills = [
            {
                id: 'power_strike',
                name: 'Power Strike',
                description: 'Deals 150% damage',
                type: 'active',
                class: 'warrior',
                cost: 10,
                cooldown: 3
            }
        ];
    }
}

// Initialize game systems
function initializeSystems() {
    // Initialize combat system
    if (typeof CombatSystem !== 'undefined') {
        CombatSystem.init();
    }
    // Initialize profession system
    if (typeof ProfessionSystem !== 'undefined') {
        ProfessionSystem.init();
    }
    
    // Initialize quest system
    if (typeof QuestSystem !== 'undefined') {
        QuestSystem.init();
    }
    
    // Initialize shop system
    if (typeof ShopSystem !== 'undefined') {
        ShopSystem.init();
    }
    
    // Initialize redeem system
    if (typeof RedeemSystem !== 'undefined') {
        RedeemSystem.init();
    }
    setupTestEvents();
}

// Start game loop
function startGameLoop() {
    // Update play time every second
    setInterval(() => {
        DataManager.updatePlayTime();
        UI.updateFooter();
    }, 1000);
    
    // Auto-save every 5 minutes
    setInterval(() => {
        DataManager.saveGameState();
    }, 300000);
}

// Setup test events (for development)
function setupTestEvents() {
    // Add test button for combat (remove in production)
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Combat';
    testButton.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:1000;padding:10px;background:#f00;color:#fff;border:none;cursor:pointer;border-radius:5px;';
    testButton.onclick = function() {
        if (typeof CombatSystem !== 'undefined') {
            CombatSystem.startCombat('goblin');
        }
    };
    document.body.appendChild(testButton);
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Game error:', e.error);
    UI.addToGameLog(`System error: ${e.message}. Check console for details.`, 'system');
});

// Save game before page unload
window.addEventListener('beforeunload', function(e) {
    DataManager.saveGameState();
});
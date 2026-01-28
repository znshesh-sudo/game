// data/monsters.json (contoh dengan rarity drops)
{
    "monsters": [
        {
            "id": "goblin",
            "name": "Goblin",
            "type": "humanoid",
            "level": 1,
            "rarity": "common",
            "stats": { "hp": 50, "maxHp": 50, "atk": 8, "def": 3, "spd": 6, "crit": 5 },
            "exp": 15,
            "gold": [2, 10],
            "drops": [
                { "itemId": "small_potion", "chance": 30, "rarity": "common" },
                { "itemId": "copper_sword", "chance": 10, "rarity": "common" },
                { "itemId": "iron_sword", "chance": 1, "rarity": "uncommon" }
            ],
            "abilities": ["basic_attack"]
        },
        {
            "id": "orc_warlord",
            "name": "Orc Warlord",
            "type": "humanoid",
            "level": 15,
            "rarity": "rare",
            "stats": { "hp": 300, "maxHp": 300, "atk": 35, "def": 20, "spd": 8, "crit": 10 },
            "exp": 150,
            "gold": [50, 200],
            "drops": [
                { "itemId": "greater_potion", "chance": 50, "rarity": "uncommon" },
                { "itemId": "steel_sword", "chance": 25, "rarity": "rare" },
                { "itemId": "dragonbone_sword", "chance": 5, "rarity": "epic" },
                { "itemId": "excalibur", "chance": 0.1, "rarity": "legendary" }
            ],
            "abilities": ["basic_attack", "furious_strike", "war_cry"]
        },
        {
            "id": "ancient_dragon",
            "name": "Ancient Dragon",
            "type": "dragon",
            "level": 50,
            "rarity": "legendary",
            "stats": { "hp": 5000, "maxHp": 5000, "atk": 200, "def": 100, "spd": 15, "crit": 20 },
            "exp": 5000,
            "gold": [1000, 5000],
            "drops": [
                { "itemId": "elixir_of_life", "chance": 100, "rarity": "legendary" },
                { "itemId": "godslayer", "chance": 10, "rarity": "mythic" },
                { "itemId": "dragon_scale", "chance": 80, "rarity": "epic" },
                { "itemId": "dragon_heart", "chance": 30, "rarity": "legendary" }
            ],
            "abilities": ["fire_breath", "tail_swipe", "roar", "ancient_magic"]
        }
    ]
}
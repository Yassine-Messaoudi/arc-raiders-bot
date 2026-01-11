const metaLoadouts = {
    tierList: {
        S: [
            { name: "AR-15 RAIDER", type: "Assault Rifle", reason: "Best all-round weapon, excellent damage and accuracy" },
            { name: "VECTOR", type: "SMG", reason: "Insane TTK up close, melts enemies" }
        ],
        A: [
            { name: "DMR SCOUT", type: "Marksman", reason: "One-tap headshots, great for PvP" },
            { name: "MP7 RUSH", type: "SMG", reason: "Fast ADS, good mobility" },
            { name: "MG-42 SUPPRESSOR", type: "LMG", reason: "Best for holding points and ARC swarms" }
        ],
        B: [
            { name: "TRENCHGUN", type: "Shotgun", reason: "Devastating up close but situational" },
            { name: "BOLT-ACTION X", type: "Sniper", reason: "High skill ceiling, one-shot potential" }
        ],
        C: [
            { name: "P320 SIDEARM", type: "Pistol", reason: "Backup only, not primary viable" }
        ]
    },
    
    bestFor: {
        pvp: {
            primary: "VECTOR",
            secondary: "P320 SIDEARM",
            reason: "Fast TTK and mobility for player encounters"
        },
        pve: {
            primary: "AR-15 RAIDER",
            secondary: "TRENCHGUN",
            reason: "Versatility for ARC encounters at any range"
        },
        extraction: {
            primary: "DMR SCOUT",
            secondary: "MP7 RUSH",
            reason: "Long range picks + close range backup"
        },
        beginner: {
            primary: "AR-15 RAIDER",
            secondary: "P320 SIDEARM",
            reason: "Forgiving and easy to use"
        }
    },

    freeLoadouts: [
        {
            name: "Starter Meta",
            difficulty: "Easy",
            weapons: ["AR-15 RAIDER", "P320 SIDEARM"],
            perks: ["Quick Hands", "Extra Ammo"],
            description: "Best loadout for new players, no rare attachments needed"
        },
        {
            name: "Rush King",
            difficulty: "Medium",
            weapons: ["VECTOR", "TRENCHGUN"],
            perks: ["Fast Reload", "Ghost"],
            description: "Aggressive close-range domination"
        },
        {
            name: "Overwatch",
            difficulty: "Hard",
            weapons: ["DMR SCOUT", "MP7 RUSH"],
            perks: ["Spotter", "Cold Blooded"],
            description: "Control the map from distance"
        }
    ]
};

const trialsGuide = {
    tips: [
        "🎯 **Complete Daily Challenges** - Easiest way to get XP and rewards",
        "⚡ **Chain Extractions** - Extract 3+ times per session for bonus XP",
        "🏃 **Speed Runs** - Quick loot runs give more XP/hour than slow careful ones",
        "👥 **Play with Squad** - 25% XP bonus when playing with teammates",
        "🎒 **High-Value Targets** - Killing elite ARCs gives 3x XP",
        "📍 **Capture Points** - Holding objectives during extraction = massive XP",
        "🔄 **Don't Die** - Survival bonus is huge, extract even with little loot",
        "⭐ **Weekly Challenges** - Save these for 2x XP events"
    ],
    
    fastRank: [
        {
            method: "Speed Extraction Farming",
            xpPerHour: "~15,000 XP",
            description: "Quick in-and-out runs, grab nearest loot and extract",
            steps: [
                "Drop at edge of map",
                "Loot 2-3 containers",
                "Head straight to extraction",
                "Repeat - aim for 5min runs"
            ]
        },
        {
            method: "ARC Hunt Grinding",
            xpPerHour: "~20,000 XP",
            description: "Focus on killing ARC enemies for combat XP",
            steps: [
                "Bring LMG or AR with lots of ammo",
                "Find ARC patrol routes",
                "Farm kills, avoid players",
                "Extract when low on ammo/health"
            ]
        },
        {
            method: "Objective Rushing",
            xpPerHour: "~25,000 XP",
            description: "Capture objectives and complete map events",
            steps: [
                "Learn objective spawn locations",
                "Rush objectives immediately on drop",
                "Complete events for bonus XP",
                "Extract after 2-3 objectives"
            ]
        }
    ],

    ranks: [
        { rank: 1, xpNeeded: 0, unlock: "Basic Loadout" },
        { rank: 5, xpNeeded: 5000, unlock: "Custom Classes" },
        { rank: 10, xpNeeded: 15000, unlock: "SMG Category" },
        { rank: 15, xpNeeded: 30000, unlock: "Marksman Rifles" },
        { rank: 20, xpNeeded: 50000, unlock: "LMG Category" },
        { rank: 25, xpNeeded: 75000, unlock: "Sniper Rifles" },
        { rank: 30, xpNeeded: 100000, unlock: "All Attachments" }
    ]
};

const questGuide = {
    daily: [
        { name: "First Blood", task: "Get 5 kills", reward: "500 XP + 100 Scrap", tip: "Easy with any weapon, focus ARC" },
        { name: "Survivor", task: "Extract 3 times", reward: "750 XP", tip: "Speed runs count!" },
        { name: "Scavenger", task: "Loot 20 containers", reward: "500 XP + Supply Crate", tip: "Hit containers near spawn" },
        { name: "Team Player", task: "Revive 2 teammates", reward: "600 XP", tip: "Play with randoms, stay close" }
    ],
    
    weekly: [
        { name: "Exterminator", task: "Kill 100 ARC units", reward: "5000 XP + Weapon Skin", tip: "LMG + ARC spawn camping" },
        { name: "Master Extractor", task: "Extract 15 times", reward: "7500 XP + Crate", tip: "Speed extraction method" },
        { name: "Completionist", task: "Complete 10 objectives", reward: "10000 XP", tip: "Objective rushing method" },
        { name: "Wealthy", task: "Extract with 50k worth of loot", reward: "3000 XP + Rare Item", tip: "One good run with high-tier loot" }
    ],

    tips: [
        "📅 **Reset Times** - Daily: 00:00 UTC | Weekly: Monday 00:00 UTC",
        "🎯 **Stack Quests** - Do multiple quests in same run for efficiency",
        "💎 **Prioritize Weekly** - Much better rewards per time invested",
        "🔄 **Re-roll Bad Quests** - You can re-roll 1 quest per day for free"
    ]
};

const scrapGuide = {
    sources: [
        { source: "Extraction Loot", amount: "100-500 per run", tip: "Prioritize rare containers" },
        { source: "Quest Rewards", amount: "100-1000", tip: "Complete dailies for steady income" },
        { source: "Selling Items", amount: "Variable", tip: "Sell duplicate attachments" },
        { source: "Season Pass", amount: "5000+ total", tip: "Free track gives scrap at certain levels" },
        { source: "Weekly Challenges", amount: "2000-5000", tip: "Best scrap/time ratio" }
    ],
    
    usage: [
        "🔫 **Weapon Unlocks** - 1000-5000 scrap per weapon",
        "🔧 **Attachments** - 200-1000 scrap each",
        "🎨 **Cosmetics** - 500-3000 scrap",
        "📦 **Supply Crates** - 1000 scrap for random items"
    ],

    farmingTips: [
        "Focus on **high-tier loot zones** for best scrap value",
        "**Don't buy cosmetics** early - save for weapons/attachments",
        "**Complete battle pass** for free scrap bonuses",
        "**Sell common duplicates** immediately"
    ]
};

module.exports = { metaLoadouts, trialsGuide, questGuide, scrapGuide };

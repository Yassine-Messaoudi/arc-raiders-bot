const weapons = [
    {
        id: "trenchgun",
        name: "TRENCHGUN",
        type: "SHOTGUN",
        range: "CLOSE",
        meta: "6 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder1.png",
        attachments: [
            { slot: "Muzzle", item: "COMPENSATOR" },
            { slot: "Barrel", item: "REINFORCED BARREL" },
            { slot: "Stock", item: "TACTICAL STOCK" },
            { slot: "Underbarrel", item: "VERTICAL GRIP" },
            { slot: "Magazine", item: "EXTENDED TUBE" },
            { slot: "Rear Grip", item: "RUBBERIZED GRIP" }
        ]
    },
    {
        id: "vectorsmg",
        name: "VECTOR",
        type: "SMG",
        range: "CLOSE",
        meta: "7 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder2.png",
        attachments: [
            { slot: "Muzzle", item: "SUPPRESSOR" },
            { slot: "Barrel", item: "SHORT BARREL" },
            { slot: "Optic", item: "REFLEX SIGHT" },
            { slot: "Stock", item: "NO STOCK" },
            { slot: "Underbarrel", item: "MERC FOREGRIP" },
            { slot: "Magazine", item: "50 ROUND DRUM" },
            { slot: "Rear Grip", item: "STIPPLED GRIP" }
        ]
    },
    {
        id: "assaultrifle",
        name: "AR-15 RAIDER",
        type: "ASSAULT RIFLE",
        range: "MEDIUM",
        meta: "8 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder3.png",
        attachments: [
            { slot: "Muzzle", item: "COMPENSATOR" },
            { slot: "Barrel", item: "EXTENDED BARREL" },
            { slot: "Optic", item: "HOLOGRAPHIC SIGHT" },
            { slot: "Stock", item: "HEAVY STOCK" },
            { slot: "Underbarrel", item: "RANGER FOREGRIP" },
            { slot: "Magazine", item: "45 ROUND MAG" },
            { slot: "Rear Grip", item: "ERGONOMIC GRIP" },
            { slot: "Perk", item: "SLEIGHT OF HAND" }
        ]
    },
    {
        id: "dmr",
        name: "DMR SCOUT",
        type: "MARKSMAN RIFLE",
        range: "LONG",
        meta: "6 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder4.png",
        attachments: [
            { slot: "Muzzle", item: "SUPPRESSOR" },
            { slot: "Barrel", item: "PRECISION BARREL" },
            { slot: "Optic", item: "4X SCOPE" },
            { slot: "Stock", item: "SNIPER STOCK" },
            { slot: "Magazine", item: "20 ROUND MAG" },
            { slot: "Rear Grip", item: "RUBBERIZED GRIP" }
        ]
    },
    {
        id: "lmg",
        name: "MG-42 SUPPRESSOR",
        type: "LMG",
        range: "MEDIUM",
        meta: "7 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder5.png",
        attachments: [
            { slot: "Muzzle", item: "HEAVY COMPENSATOR" },
            { slot: "Barrel", item: "BULL BARREL" },
            { slot: "Optic", item: "HYBRID SIGHT" },
            { slot: "Stock", item: "TACTICAL STOCK" },
            { slot: "Underbarrel", item: "BIPOD" },
            { slot: "Magazine", item: "150 ROUND BOX" },
            { slot: "Rear Grip", item: "GRANULATED GRIP" }
        ]
    },
    {
        id: "sniper",
        name: "BOLT-ACTION X",
        type: "SNIPER RIFLE",
        range: "LONG",
        meta: "5 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder6.png",
        attachments: [
            { slot: "Muzzle", item: "SILENCER" },
            { slot: "Barrel", item: "LONG RANGE BARREL" },
            { slot: "Optic", item: "8X SCOPE" },
            { slot: "Stock", item: "PRECISION STOCK" },
            { slot: "Rear Grip", item: "STIPPLED GRIP" }
        ]
    },
    {
        id: "pistol",
        name: "P320 SIDEARM",
        type: "PISTOL",
        range: "CLOSE",
        meta: "4 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder7.png",
        attachments: [
            { slot: "Muzzle", item: "SUPPRESSOR" },
            { slot: "Barrel", item: "EXTENDED BARREL" },
            { slot: "Magazine", item: "21 ROUND MAG" },
            { slot: "Rear Grip", item: "TEXTURED GRIP" }
        ]
    },
    {
        id: "smg2",
        name: "MP7 RUSH",
        type: "SMG",
        range: "CLOSE",
        meta: "6 ATTACHMENTS META",
        image: "https://i.imgur.com/placeholder8.png",
        attachments: [
            { slot: "Muzzle", item: "MONO SUPPRESSOR" },
            { slot: "Barrel", item: "COMPACT BARREL" },
            { slot: "Optic", item: "RED DOT SIGHT" },
            { slot: "Stock", item: "FOLDING STOCK" },
            { slot: "Magazine", item: "40 ROUND MAG" },
            { slot: "Rear Grip", item: "RUBBER GRIP" }
        ]
    }
];

const attachmentTips = [
    "🎯 **Compensator** - Best for reducing vertical recoil on automatic weapons",
    "🔇 **Suppressor** - Keeps you hidden from enemies, slight damage reduction",
    "📏 **Extended Magazine** - More bullets = less reloading during fights",
    "🔭 **Variable Scope** - Great for versatile engagement ranges",
    "✋ **Vertical Foregrip** - Best overall recoil control for most weapons",
    "📐 **Angled Foregrip** - Faster ADS time, good for aggressive play",
    "🎚️ **Muzzle Brake** - Reduces horizontal recoil, great for burst fire"
];

module.exports = { weapons, attachmentTips };

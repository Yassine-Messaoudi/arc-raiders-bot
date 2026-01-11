const weapons = [
    {
        id: "tempest",
        name: "TEMPEST",
        type: "ASSAULT RIFLE",
        range: "MEDIUM",
        tier: "S",
        meta: "BEST AR - 6 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/tempest.png",
        attachments: [
            { slot: "Muzzle", item: "Compensator I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "Reflex Sight" },
            { slot: "Stock", item: "Stable Stock I" },
            { slot: "Underbarrel", item: "Vertical Grip I" },
            { slot: "Magazine", item: "Extended Medium Mag I" }
        ]
    },
    {
        id: "bettina",
        name: "BETTINA",
        type: "SMG",
        range: "CLOSE",
        tier: "S",
        meta: "BEST SMG - 5 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/bettina.png",
        attachments: [
            { slot: "Muzzle", item: "Silencer I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "Reflex Sight" },
            { slot: "Stock", item: "Lightweight Stock" },
            { slot: "Magazine", item: "Extended Light Mag I" }
        ]
    },
    {
        id: "valkyrie",
        name: "VALKYRIE",
        type: "MARKSMAN RIFLE",
        range: "LONG",
        tier: "A",
        meta: "BEST DMR - 5 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/valkyrie.png",
        attachments: [
            { slot: "Muzzle", item: "Silencer I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "4x Scope" },
            { slot: "Stock", item: "Stable Stock I" },
            { slot: "Magazine", item: "Extended Medium Mag I" }
        ]
    },
    {
        id: "thunderclap",
        name: "THUNDERCLAP",
        type: "SHOTGUN",
        range: "CLOSE",
        tier: "A",
        meta: "BEST SHOTGUN - 4 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/thunderclap.png",
        attachments: [
            { slot: "Muzzle", item: "Shotgun Choke I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Stock", item: "Padded Stock" },
            { slot: "Magazine", item: "Extended Shotgun Mag I" }
        ]
    },
    {
        id: "guardian",
        name: "GUARDIAN",
        type: "LMG",
        range: "MEDIUM",
        tier: "A",
        meta: "BEST LMG - 6 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/guardian.png",
        attachments: [
            { slot: "Muzzle", item: "Compensator I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "Reflex Sight" },
            { slot: "Stock", item: "Stable Stock I" },
            { slot: "Underbarrel", item: "Vertical Grip I" },
            { slot: "Magazine", item: "Extended Medium Mag I" }
        ]
    },
    {
        id: "frontier",
        name: "FRONTIER",
        type: "SNIPER RIFLE",
        range: "LONG",
        tier: "A",
        meta: "BEST SNIPER - 4 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/frontier.png",
        attachments: [
            { slot: "Muzzle", item: "Silencer I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "8x Scope" },
            { slot: "Stock", item: "Stable Stock I" }
        ]
    },
    {
        id: "reaper",
        name: "REAPER",
        type: "SMG",
        range: "CLOSE",
        tier: "A",
        meta: "FAST FIRE SMG - 5 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/reaper.png",
        attachments: [
            { slot: "Muzzle", item: "Muzzle Brake I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "Red Dot Sight" },
            { slot: "Stock", item: "Lightweight Stock" },
            { slot: "Magazine", item: "Extended Light Mag I" }
        ]
    },
    {
        id: "viper",
        name: "VIPER",
        type: "PISTOL",
        range: "CLOSE",
        tier: "B",
        meta: "BEST PISTOL - 3 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/viper.png",
        attachments: [
            { slot: "Muzzle", item: "Silencer I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Magazine", item: "Extended Light Mag I" }
        ]
    },
    {
        id: "havoc",
        name: "HAVOC",
        type: "ASSAULT RIFLE",
        range: "MEDIUM",
        tier: "A",
        meta: "HIGH DAMAGE AR - 6 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/havoc.png",
        attachments: [
            { slot: "Muzzle", item: "Muzzle Brake I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "4x Scope" },
            { slot: "Stock", item: "Stable Stock I" },
            { slot: "Underbarrel", item: "Angled Grip I" },
            { slot: "Magazine", item: "Extended Medium Mag I" }
        ]
    },
    {
        id: "phantom",
        name: "PHANTOM",
        type: "SMG",
        range: "CLOSE",
        tier: "B",
        meta: "STEALTH SMG - 5 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/phantom.png",
        attachments: [
            { slot: "Muzzle", item: "Silencer I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "Red Dot Sight" },
            { slot: "Stock", item: "Lightweight Stock" },
            { slot: "Magazine", item: "Extended Light Mag I" }
        ]
    },
    {
        id: "crusher",
        name: "CRUSHER",
        type: "SHOTGUN",
        range: "CLOSE",
        tier: "B",
        meta: "AUTO SHOTGUN - 4 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/crusher.png",
        attachments: [
            { slot: "Muzzle", item: "Shotgun Choke I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Stock", item: "Padded Stock" },
            { slot: "Magazine", item: "Extended Shotgun Mag I" }
        ]
    },
    {
        id: "sentinel",
        name: "SENTINEL",
        type: "MARKSMAN RIFLE",
        range: "LONG",
        tier: "B",
        meta: "SEMI-AUTO DMR - 5 ATTACHMENTS",
        image: "https://cdn.metaforge.app/arc-raiders/items/sentinel.png",
        attachments: [
            { slot: "Muzzle", item: "Compensator I" },
            { slot: "Barrel", item: "Extended Barrel" },
            { slot: "Optic", item: "4x Scope" },
            { slot: "Stock", item: "Lightweight Stock" },
            { slot: "Magazine", item: "Extended Medium Mag I" }
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

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { loadWikiCache } = require('../services/wikiFetcher.js');
const { weapons: localWeapons } = require('../data/weapons.js');

const VALID_ATTACHMENT_SLOTS = new Set([
    'Muzzle',
    'Underbarrel',
    'Stock',
    'Magazine',
    'Light Magazine',
    'Medium Magazine',
    'Shotgun Magazine',
    'Tech Mod'
]);

function canonicalizeSlotName(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;

    let s = raw
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+slot\b/gi, '')
        .replace(/\s+mods?\b/gi, ' Mod')
        .replace(/\s+magazine\b/gi, ' Magazine')
        .replace(/\s+mag\b/gi, ' Magazine')
        .replace(/\s+/g, ' ')
        .trim();

    const lower = s.toLowerCase();
    if (lower === 'under barrel') s = 'Underbarrel';
    if (lower === 'underbarrel') s = 'Underbarrel';
    if (lower === 'tech mod') s = 'Tech Mod';
    if (lower === 'muzzle') s = 'Muzzle';
    if (lower === 'stock') s = 'Stock';
    if (lower === 'magazine') s = 'Magazine';
    if (lower === 'light magazine') s = 'Light Magazine';
    if (lower === 'medium magazine') s = 'Medium Magazine';
    if (lower === 'shotgun magazine') s = 'Shotgun Magazine';

    return VALID_ATTACHMENT_SLOTS.has(s) ? s : null;
}

function slugify(input) {
    return String(input || '')
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getWeaponsFromWiki() {
    const cache = loadWikiCache();
    const pages = (cache.categories?.Weapons?.pages || []).filter(p => (p.title || '').toLowerCase() !== 'weapons');

    return pages.map(p => {
        const id = slugify(p.title);
        const local = localWeapons.find(w => slugify(w.id || w.name) === id || slugify(w.name) === id) || null;

        return {
            id,
            name: p.title,
            type: local?.type || 'Weapon',
            range: local?.range || '—',
            meta: local?.meta || 'Wiki',
            image: p.image || local?.image || null,
            url: p.url || null,
            summary: p.summary || '',
            attachmentSlots: Array.isArray(p.attachmentSlots) ? p.attachmentSlots : [],
            attachmentSlotCount: Number.isFinite(p.attachmentSlotCount) ? p.attachmentSlotCount : undefined,
            attachments: Array.isArray(local?.attachments) ? local.attachments : []
        };
    });
}

function getAttachmentPagesFromWiki() {
    const cache = loadWikiCache();
    return cache.categories?.Attachments?.pages || [];
}

function resolveAttachmentDisplayName(rawName) {
    const name = String(rawName || '').trim();
    if (!name) return { label: '', url: null };

    const pages = getAttachmentPagesFromWiki();
    if (!pages.length) return { label: name, url: null };

    const normalized = name
        .replace(/\s+magazine\b/gi, ' Mag')
        .replace(/\s+mag\b/gi, ' Mag')
        .replace(/\s+/g, ' ')
        .trim();

    const wanted = slugify(normalized);

    const scored = pages
        .map(p => {
            const title = p.title || '';
            const slug = slugify(title);
            let score = 0;

            if (slug === wanted) score += 100;
            if (slug.startsWith(wanted)) score += 40;
            if (slug.includes(wanted)) score += 20;
            if (wanted && slug.includes(`${wanted}-i`)) score += 35;
            if (slug.endsWith('-iii')) score += 6;
            if (slug.endsWith('-ii')) score += 4;
            if (slug.endsWith('-i')) score += 2;

            return { page: p, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    const best = scored[0]?.page;
    if (!best) return { label: name, url: null };
    return { label: best.title, url: best.url || null };
}

function getWeapons() {
    return getWeaponsFromWiki();
}

async function autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    if (!focused || focused.name !== 'weapon') {
        await interaction.respond([]);
        return;
    }

    const query = String(focused.value || '').trim();
    const queryLower = query.toLowerCase();
    const querySlug = slugify(query);

    const weapons = getWeapons();
    const sorted = weapons.slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    const choices = (query ? sorted
        .map(w => {
            const name = String(w.name || '');
            const lower = name.toLowerCase();
            const slug = slugify(name);
            let score = 0;
            if (lower === queryLower) score += 100;
            if (slug === querySlug) score += 95;
            if (lower.startsWith(queryLower)) score += 60;
            if (slug.startsWith(querySlug)) score += 55;
            if (lower.includes(queryLower)) score += 30;
            if (slug.includes(querySlug)) score += 25;
            return { weapon: w, score };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        : sorted.map(w => ({ weapon: w, score: 1 })))
        .slice(0, 25)
        .map(x => ({ name: x.weapon.name, value: x.weapon.id }));

    await interaction.respond(choices);
}

function findWeapon(weapons, weaponIdOrName) {
    if (!weaponIdOrName) return null;
    const raw = String(weaponIdOrName);
    const lower = raw.toLowerCase();
    const cleaned = lower.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const slug = slugify(raw);
    const cleanedSlug = slugify(cleaned);

    return (
        weapons.find(w => w.id === raw) ||
        weapons.find(w => w.id === lower) ||
        weapons.find(w => slugify(w.id) === slug) ||
        weapons.find(w => slugify(w.id) === cleanedSlug) ||
        weapons.find(w => (w.name || '').toLowerCase() === lower) ||
        weapons.find(w => (w.name || '').toLowerCase() === cleaned) ||
        weapons.find(w => slugify(w.name) === slug) ||
        weapons.find(w => slugify(w.name) === cleanedSlug) ||
        weapons.find(w => (w.name || '').toLowerCase().includes(lower)) ||
        weapons.find(w => (w.name || '').toLowerCase().includes(cleaned)) ||
        weapons.find(w => lower.includes((w.name || '').toLowerCase())) ||
        weapons.find(w => cleaned.includes((w.name || '').toLowerCase())) ||
        null
    );
}

function createWeaponEmbed(weapon, username) {
    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: username })
        .setTitle(`🎮 ${weapon.name} (${weapon.type})`)
        .setTimestamp()
        .setFooter({ text: 'ARC Raiders Loadouts' });

    function slotMatches(candidateSlot, desiredSlot) {
        const cCanon = canonicalizeSlotName(candidateSlot);
        const dCanon = canonicalizeSlotName(desiredSlot);
        if (!cCanon || !dCanon) return false;
        if (cCanon === dCanon) return true;

        const c = cCanon.toLowerCase();
        const d = dCanon.toLowerCase();
        if (d.includes('magazine') && c === 'magazine') return true;
        if (c.includes('magazine') && d === 'magazine') return true;
        return false;
    }

    function pickAttachmentForSlot(attachments, desiredSlot) {
        if (!Array.isArray(attachments) || !attachments.length) return null;
        return attachments.find(a => slotMatches(a?.slot, desiredSlot)) || null;
    }

    const build = weapon.build || 'balanced';
    const bestAttachments = (build === 'balanced' && Array.isArray(weapon.attachments) && weapon.attachments.length)
        ? weapon.attachments
        : getBestAttachments(build);

    const fallbackAttachments = getBestAttachments(build);

    const desiredSlotsRaw = Array.isArray(weapon.attachmentSlots) ? weapon.attachmentSlots : [];
    const desiredSlots = desiredSlotsRaw
        .map(canonicalizeSlotName)
        .filter(Boolean);

    const slotCount = Number.isFinite(weapon.attachmentSlotCount) ? weapon.attachmentSlotCount : undefined;
    const rawHasOnlyMods = desiredSlotsRaw.length > 0
        && desiredSlotsRaw.every(s => /\bmod\b/i.test(String(s || '')) && !/tech\s*mod/i.test(String(s || '')));
    const noAttachments = slotCount === 0 || rawHasOnlyMods;

    let attText;
    if (noAttachments) {
        attText = '_No attachments_';
    } else {
        const slotsToShow = desiredSlots.length ? desiredSlots : ['Muzzle', 'Underbarrel', 'Stock', 'Magazine'];
        attText = slotsToShow
            .map(slot => {
                const picked = pickAttachmentForSlot(bestAttachments, slot) || pickAttachmentForSlot(fallbackAttachments, slot);
                if (!picked || !picked.item) return `**${slot}:** —`;
                const resolved = resolveAttachmentDisplayName(picked.item);
                const label = resolved.label || String(picked.item);
                if (resolved.url) return `**${slot}:** [${label}](${resolved.url})`;
                return `**${slot}:** ${label}`;
            })
            .join('\n');
    }

    embed.addFields(
        {
            name: `⭐ Best Attachments (${build.toUpperCase()})`,
            value: attText,
            inline: false
        }
    );

    const descriptionParts = [];
    if (weapon.summary) descriptionParts.push(`_${weapon.summary}_`);
    if (weapon.url) descriptionParts.push(weapon.url);
    if (descriptionParts.length) embed.setDescription(descriptionParts.join('\n\n'));

    if (weapon.image) {
        embed.setImage(weapon.image);
    }

    return embed;
}

function getBestAttachments(build) {
    const builds = {
        balanced: [
            { slot: 'Muzzle', item: 'Compensator I' },
            { slot: 'Underbarrel', item: 'Vertical Grip I' },
            { slot: 'Stock', item: 'Stable Stock I' },
            { slot: 'Magazine', item: 'Extended Medium Mag I' }
        ],
        stealth: [
            { slot: 'Muzzle', item: 'Silencer I' },
            { slot: 'Underbarrel', item: 'Angled Grip I' },
            { slot: 'Stock', item: 'Lightweight Stock' },
            { slot: 'Magazine', item: 'Extended Light Mag I' }
        ],
        range: [
            { slot: 'Muzzle', item: 'Muzzle Brake I' },
            { slot: 'Underbarrel', item: 'Horizontal Grip' },
            { slot: 'Stock', item: 'Stable Stock I' },
            { slot: 'Magazine', item: 'Extended Medium Mag I' }
        ],
        mobility: [
            { slot: 'Muzzle', item: 'Muzzle Brake I' },
            { slot: 'Underbarrel', item: 'Angled Grip I' },
            { slot: 'Stock', item: 'Lightweight Stock' },
            { slot: 'Magazine', item: 'Extended Light Mag I' }
        ]
    };

    return builds[build] || builds.balanced;
}

function createButtons(currentIndex, totalWeapons) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('loadout_back')
                .setLabel('< BACK')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === 0),
            new ButtonBuilder()
                .setCustomId('loadout_list')
                .setLabel('All Loadouts')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('loadout_next')
                .setLabel('NEXT >')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === totalWeapons - 1)
        );
    return row;
}

function createWeaponSelect() {
    const weapons = getWeapons().slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const options = weapons.slice(0, 25).map(w => ({
        label: w.name,
        description: `ARC Raiders Wiki weapon`,
        value: w.id
    }));

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('weapon_select')
                .setPlaceholder('Select a weapon...')
                .addOptions(options)
        );
    return row;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loadout')
        .setDescription('Browse ARC Raiders weapons (from the Wiki)')
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('Select a specific weapon')
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option
                .setName('build')
                .setDescription('Attachment build style')
                .setRequired(false)
                .addChoices(
                    { name: '⭐ Balanced (recommended)', value: 'balanced' },
                    { name: '🔇 Stealth', value: 'stealth' },
                    { name: '🎯 Range', value: 'range' },
                    { name: '🏃 Mobility', value: 'mobility' }
                )),
    
    async execute(interaction) {
        const weaponId = interaction.options.getString('weapon');
        const build = interaction.options.getString('build') || 'balanced';
        const username = interaction.user.username;
        const weapons = getWeapons();

        if (!weaponId) {
            const sortedWeapons = weapons.slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            const shown = sortedWeapons.slice(0, 25);
            const remainder = Math.max(0, sortedWeapons.length - shown.length);

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎮 ARC Raiders Loadouts')
                .setDescription('Select a weapon from the menu below or use `/loadout weapon:<name>`')
                .addFields(
                    { 
                        name: '📋 Available Weapons', 
                        value: weapons.length
                            ? `${shown.map(w => `• **${w.name}**`).join('\n')}${remainder ? `\n\n…and ${remainder} more. Type \/loadout weapon:<name>` : ''}`
                            : 'No weapons found in wiki cache. Try `/db refresh:true` first.',
                        inline: false 
                    }
                )
                .setFooter({ text: 'ARC Raiders Bot' })
                .setTimestamp();

            const selectRow = createWeaponSelect();
            await interaction.reply({ embeds: [embed], components: [selectRow] });
            return;
        }

        const weapon = findWeapon(weapons, weaponId);
        if (!weapon) {
            const examples = weapons.slice(0, 10).map(w => w.name).join(', ');
            await interaction.reply({ content: `Weapon not found: ${weaponId}. Try /db query:<name> then use /loadout again. Examples: ${examples}`, ephemeral: true });
            return;
        }

        weapon.build = build;
        const currentIndex = weapons.findIndex(w => w.id === weapon.id);
        const embed = createWeaponEmbed(weapon, username);
        const buttons = createButtons(currentIndex, weapons.length);

        await interaction.reply({ embeds: [embed], components: [buttons] });
    }
};

module.exports.createWeaponEmbed = createWeaponEmbed;
module.exports.createButtons = createButtons;
module.exports.getWeapons = getWeapons;
module.exports.autocomplete = autocomplete;

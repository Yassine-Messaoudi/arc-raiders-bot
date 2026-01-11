const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const { loadWikiCache, updateWikiCache } = require('../services/wikiFetcher.js');

const WIKI_API = 'https://arc-raiders.fandom.com/api.php';

function slugify(input) {
    return String(input || '')
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getQuestPages() {
    const cache = loadWikiCache();
    return cache.categories?.Quests?.pages || [];
}

function searchQuests(query) {
    const pages = getQuestPages();
    if (!query) return pages;

    const q = String(query).toLowerCase().trim();
    return pages.filter(p => {
        const title = (p.title || '').toLowerCase();
        const summary = (p.summary || '').toLowerCase();
        return title.includes(q) || summary.includes(q);
    });
}

async function fetchQuestDetails(title) {
    const response = await axios.get(WIKI_API, {
        params: {
            format: 'json',
            action: 'query',
            prop: 'extracts|pageimages|info',
            titles: title,
            redirects: 1,
            explaintext: 1,
            exchars: 3500,
            inprop: 'url',
            piprop: 'original'
        },
        timeout: 15000,
        headers: {
            'User-Agent': 'ArcRaidersBot/1.0 (Discord bot; quest lookup)'
        }
    });

    const pagesObj = response.data?.query?.pages || {};
    const page = Object.values(pagesObj)[0];
    if (!page || page.missing) return null;

    return {
        title: page.title,
        url: page.fullurl || null,
        text: page.extract || '',
        image: page.original?.source || null
    };
}

function buildQuestListPayload(query) {
    const results = searchQuests(query);
    const shown = results.slice(0, 25);

    const embed = new EmbedBuilder()
        .setColor(0x00AAFF)
        .setTitle('📋 Quests')
        .setDescription(query
            ? `Results for: **${query}**\nSelect a quest from the dropdown.`
            : 'Select a quest from the dropdown.')
        .addFields({
            name: `📌 Found ${results.length} quest(s)`,
            value: shown.length
                ? shown.map(p => `• **${p.title}**${p.summary ? ` — ${p.summary.slice(0, 80)}` : ''}`).join('\n')
                : 'No quests found. Try another query.',
            inline: false
        })
        .setFooter({ text: 'Use /quests query:<name> to search' })
        .setTimestamp();

    if (!shown.length) {
        return { embeds: [embed], components: [] };
    }

    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('quest_select')
            .setPlaceholder('Select a quest...')
            .addOptions(
                shown.map(p => ({
                    label: p.title,
                    description: p.summary ? p.summary.slice(0, 90) : 'Open quest details',
                    value: slugify(p.title)
                }))
            )
    );

    return { embeds: [embed], components: [row] };
}

async function handleQuestSelect(interaction) {
    const pages = getQuestPages();
    const selected = interaction.values[0];
    const page = pages.find(p => slugify(p.title) === selected);

    if (!page) {
        await interaction.reply({ content: 'Quest not found in cache. Try `/db refresh:true`.', ephemeral: true });
        return;
    }

    await interaction.deferUpdate();

    const details = await fetchQuestDetails(page.title);
    if (!details) {
        await interaction.followUp({ content: 'Could not load quest details. Try again later.', ephemeral: true });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x00AAFF)
        .setTitle(`📋 ${details.title}`)
        .setDescription(details.text || 'No description available.')
        .setTimestamp();

    if (details.image) embed.setImage(details.image);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('quest_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setLabel('Open Wiki Page')
            .setStyle(ButtonStyle.Link)
            .setURL(details.url || 'https://arc-raiders.fandom.com/wiki/Arc_Raiders_Wiki')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function handleQuestBack(interaction) {
    const payload = buildQuestListPayload(null);
    await interaction.update(payload);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Browse quests with pictures and full details (wiki)')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Search quests by name')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('refresh')
                .setDescription('Force refresh the wiki database')
                .setRequired(false)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const refresh = interaction.options.getBoolean('refresh') || false;

        if (refresh) {
            await interaction.deferReply();
            await updateWikiCache({ force: true });
        }

        const results = searchQuests(query);
        if (query && results.length === 1) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply();
            }
            const details = await fetchQuestDetails(results[0].title);
            if (!details) {
                await interaction.editReply({ content: 'Could not load quest details. Try again later.' });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle(`📋 ${details.title}`)
                .setDescription(details.text || 'No description available.')
                .setTimestamp();

            if (details.image) embed.setImage(details.image);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Open Wiki Page')
                    .setStyle(ButtonStyle.Link)
                    .setURL(details.url || 'https://arc-raiders.fandom.com/wiki/Arc_Raiders_Wiki')
            );

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
        }

        const payload = buildQuestListPayload(query);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(payload);
        } else {
            await interaction.reply(payload);
        }
    },

    handleQuestSelect,
    handleQuestBack
};

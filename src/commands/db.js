const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadWikiCache, updateWikiCache, DEFAULT_CATEGORIES } = require('../services/wikiFetcher.js');

function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('db')
        .setDescription('Search ARC Raiders Wiki database (weapons, items, maps, quests, etc.)')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Search text (ex: tempest, map, quest)')
                .setRequired(false)
        )
        .addStringOption(option => {
            const opt = option
                .setName('category')
                .setDescription('Limit search to a wiki category')
                .setRequired(false);

            DEFAULT_CATEGORIES.slice(0, 25).forEach(c => {
                opt.addChoices({ name: c, value: c });
            });

            return opt;
        })
        .addBooleanOption(option =>
            option
                .setName('refresh')
                .setDescription('Force refresh from the wiki now')
                .setRequired(false)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const category = interaction.options.getString('category');
        const refresh = interaction.options.getBoolean('refresh') || false;

        if (refresh) {
            await interaction.deferReply({ ephemeral: true });
            await updateWikiCache({ force: true });
            await interaction.editReply('✅ Wiki database refreshed.');
            return;
        }

        const cache = loadWikiCache();
        const lastUpdated = cache.lastUpdated ? new Date(cache.lastUpdated).toLocaleString() : 'Never';

        if (!query && !category) {
            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle('📚 ARC Raiders Wiki Database')
                .setDescription('Use `/db query:<text>` or `/db category:<name>`')
                .setFooter({ text: `Last updated: ${lastUpdated}` })
                .setTimestamp();

            const fields = DEFAULT_CATEGORIES.map(c => {
                const count = cache.categories?.[c]?.count ?? 0;
                return { name: c, value: `${count} pages`, inline: true };
            });

            chunkArray(fields, 24).slice(0, 1).forEach(group => embed.addFields(group));

            await interaction.reply({ embeds: [embed] });
            return;
        }

        let pages = [];

        if (category) {
            pages = cache.categories?.[category]?.pages || [];
        } else {
            pages = cache.allPages || [];
        }

        if (query) {
            const q = query.toLowerCase();
            pages = pages.filter(p => (p.title || '').toLowerCase().includes(q));
        }

        pages = pages.slice(0, 15);

        if (!pages.length) {
            await interaction.reply({ content: 'No results found. Try another query or category.', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle('🔎 Database Results')
            .setDescription(pages.map((p, i) => {
                const url = p.url ? `\n${p.url}` : '';
                const summary = p.summary ? `\n_${p.summary}_` : '';
                return `**${i + 1}. ${p.title}**${summary}${url}`;
            }).join('\n\n'))
            .setFooter({ text: `Last updated: ${lastUpdated}` })
            .setTimestamp();

        const firstImage = pages.find(p => p.image)?.image;
        if (firstImage) embed.setThumbnail(firstImage);

        await interaction.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadWikiCache, DEFAULT_CATEGORIES } = require('../services/wikiFetcher.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('items')
        .setDescription('Browse all ARC Raiders items database')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Item category to browse')
                .setRequired(false)
                .addChoices(
                    ...DEFAULT_CATEGORIES.slice(0, 25).map(c => ({ name: c, value: c }))
                )),
    
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const cache = loadWikiCache();
        const lastUpdated = cache.lastUpdated ? new Date(cache.lastUpdated).toLocaleString() : 'Never';

        if (!category) {
            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle('📦 ARC Raiders Item Database')
                .setDescription('Browse items from the ARC Raiders Wiki database')
                .addFields(
                    ...DEFAULT_CATEGORIES.map(c => {
                        const count = cache.categories?.[c]?.count ?? 0;
                        return { name: c, value: `${count} pages`, inline: true };
                    }).slice(0, 24)
                )
                .setFooter({ text: 'Use /items category:<type> to browse' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        const pages = cache.categories?.[category]?.pages || [];
        if (!pages.length) {
            await interaction.reply({ content: 'No pages found for this category (try /db refresh:true).', ephemeral: true });
            return;
        }

        const list = pages.slice(0, 20).map((p, i) => {
            const url = p.url ? `\n${p.url}` : '';
            const summary = p.summary ? `\n_${p.summary}_` : '';
            return `**${i + 1}. ${p.title}**${summary}${url}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle(`📦 ${category}`)
            .setDescription(list)
            .setFooter({ text: `Last updated: ${lastUpdated}` })
            .setTimestamp();

        const firstImage = pages.find(p => p.image)?.image;
        if (firstImage) embed.setThumbnail(firstImage);

        await interaction.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCachedData, getLastUpdated, updateAllData } = require('../services/dataFetcher.js');
const { news: fallbackNews } = require('../data/news.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('news')
        .setDescription('Get the latest ARC Raiders news and updates')
        .addBooleanOption(option =>
            option.setName('refresh')
                .setDescription('Force refresh data from sources')
                .setRequired(false)),
    
    async execute(interaction) {
        const shouldRefresh = interaction.options.getBoolean('refresh');

        if (shouldRefresh) {
            await interaction.deferReply();
            await updateAllData();
        }

        const cachedData = getCachedData();
        const newsItems = cachedData.news.length > 0 ? cachedData.news : fallbackNews;

        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('📰 ARC Raiders News')
            .setDescription('Latest news and updates from the community')
            .setTimestamp()
            .setFooter({ text: `Last updated: ${getLastUpdated()}` });

        newsItems.slice(0, 8).forEach((item, index) => {
            const source = item.source ? ` [${item.source}]` : '';
            const score = item.score ? ` (⬆️ ${item.score})` : '';
            embed.addFields({
                name: `${index + 1}. ${item.title}${source}`,
                value: `📅 ${item.date}${score}\n🔗 [Read More](${item.url})`,
                inline: false
            });
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Official Site')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://www.arcraiders.com'),
                new ButtonBuilder()
                    .setLabel('Reddit')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://www.reddit.com/r/ArcRaiders'),
                new ButtonBuilder()
                    .setCustomId('news_refresh')
                    .setLabel('🔄 Refresh')
                    .setStyle(ButtonStyle.Secondary)
            );

        if (shouldRefresh) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};

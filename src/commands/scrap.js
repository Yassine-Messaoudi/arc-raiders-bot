const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { scrapGuide } = require('../data/meta.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scrap')
        .setDescription('Scrap farming guide and economy tips'),
    
    async execute(interaction) {
        const sourcesEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('💰 Scrap Sources')
            .setDescription('How to earn scrap in ARC Raiders')
            .addFields(
                ...scrapGuide.sources.map(s => ({
                    name: `${s.source}`,
                    value: `💵 **${s.amount}**\n💡 ${s.tip}`,
                    inline: true
                }))
            )
            .setTimestamp();

        const usageEmbed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('🛒 What to Spend Scrap On')
            .setDescription(scrapGuide.usage.join('\n\n'))
            .setTimestamp();

        const tipsEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('💡 Scrap Farming Tips')
            .setDescription(scrapGuide.farmingTips.map(t => `• ${t}`).join('\n\n'))
            .addFields({
                name: '🎯 Priority Order',
                value: '1. Weapons > 2. Key Attachments > 3. Cosmetics\nDon\'t waste scrap on looks until you have good loadouts!',
                inline: false
            })
            .setFooter({ text: 'Use /meta type:free for loadouts that don\'t need rare items' })
            .setTimestamp();

        await interaction.reply({
            content: '## 💰 ARC Raiders Scrap Guide',
            embeds: [sourcesEmbed, usageEmbed, tipsEmbed]
        });
    }
};

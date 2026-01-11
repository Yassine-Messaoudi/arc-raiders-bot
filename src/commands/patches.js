const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { patches } = require('../data/news.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('patches')
        .setDescription('View recent ARC Raiders patch notes and updates'),
    
    async execute(interaction) {
        const embeds = patches.map((patch, index) => {
            const embed = new EmbedBuilder()
                .setColor(index === 0 ? 0x00FF00 : 0x888888)
                .setTitle(`🔧 ${patch.version}`)
                .setDescription(`📅 **Release:** ${patch.date}`)
                .addFields({
                    name: '📋 Changes',
                    value: patch.changes.map(change => `• ${change}`).join('\n'),
                    inline: false
                })
                .setTimestamp();

            if (index === 0) {
                embed.setFooter({ text: '✨ Latest Patch' });
            }

            return embed;
        });

        await interaction.reply({ 
            content: '## 📦 ARC Raiders Patch Notes',
            embeds: embeds 
        });
    }
};

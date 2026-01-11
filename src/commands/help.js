const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLastUpdated } = require('../services/dataFetcher.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available ARC Raiders bot commands'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('🤖 ARC Raiders Bot - Help')
            .setDescription('Your ultimate companion for ARC Raiders information!\n*Auto-updates every 6 hours*')
            .addFields(
                { 
                    name: '📰 /news [refresh]', 
                    value: 'Live news from Reddit & official sources', 
                    inline: true 
                },
                { 
                    name: '🔧 /patches', 
                    value: 'Recent patch notes', 
                    inline: true 
                },
                { 
                    name: '🔫 /loadout [weapon]', 
                    value: 'Weapon attachments with images', 
                    inline: true 
                },
                { 
                    name: '🏆 /meta [type]', 
                    value: 'Tier list, best guns, free loadouts', 
                    inline: true 
                },
                { 
                    name: '⚡ /trials [info]', 
                    value: 'Fast ranking tips & XP methods', 
                    inline: true 
                },
                { 
                    name: '📋 /quests [type]', 
                    value: 'Daily/Weekly quest guides', 
                    inline: true 
                },
                { 
                    name: '💰 /scrap', 
                    value: 'Scrap farming & economy guide', 
                    inline: true 
                },
                { 
                    name: '💡 /tips [type]', 
                    value: 'Random gameplay tips', 
                    inline: true 
                },
                { 
                    name: '❓ /help', 
                    value: 'This help menu', 
                    inline: true 
                }
            )
            .addFields({
                name: '🔄 Auto-Updates',
                value: `Data refreshes from Reddit & web sources\nLast update: ${getLastUpdated()}`,
                inline: false
            })
            .setFooter({ text: 'ARC Raiders Bot • Made with ❤️ for Raiders' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLastUpdated } = require('../services/dataFetcher.js');
const { getWikiLastUpdated } = require('../services/wikiFetcher.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available ARC Raiders bot commands'),
    
    async execute(interaction) {
        const wikiLastUpdatedIso = getWikiLastUpdated();
        const wikiLastUpdated = wikiLastUpdatedIso
            ? new Date(wikiLastUpdatedIso).toLocaleString()
            : 'Never';

        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('🤖 ARC Raiders Bot - Help')
            .setDescription('Start here. Use `/db` and `/items` for the full game database (with images + links).')
            .addFields(
                {
                    name: '✅ Quick Start (copy/paste)',
                    value: [
                        '`/db query:bettina`',
                        '`/items category:Weapons`',
                        '`/loadout weapon:bettina`',
                        '`/quests query:tempest`'
                    ].join('\n'),
                    inline: false
                },
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
                    value: 'Weapon page + best attachment recommendations', 
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
                    name: '📋 /quests [query]', 
                    value: 'Quest database with images + details', 
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
                    name: '📦 /items [category]', 
                    value: 'Browse wiki categories (weapons, maps, quests...)', 
                    inline: true 
                },
                { 
                    name: '📚 /db [query] [category] [refresh]', 
                    value: 'Search the full wiki database with images/links', 
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
                value: `News update: ${getLastUpdated()}\nWiki database: ${wikiLastUpdated}`,
                inline: false
            })
            .setFooter({ text: 'ARC Raiders Bot • Made with ❤️ for Raiders' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_weapons')
                    .setLabel('Weapons')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_quests')
                    .setLabel('Quests')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_refresh_wiki')
                    .setLabel('Refresh Wiki')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};

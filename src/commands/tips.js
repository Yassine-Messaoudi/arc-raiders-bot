const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { attachmentTips } = require('../data/weapons.js');

const gameTips = [
    "🏃 **Movement is key** - Always stay mobile during ARC encounters",
    "👥 **Stick with your squad** - Solo runs are dangerous against the ARC",
    "🎒 **Manage your loot** - Don't get greedy, extract when you have valuable items",
    "🔊 **Use audio cues** - Listen for ARC patrols and enemy Raiders",
    "🗺️ **Know your exits** - Always have an extraction plan ready",
    "⚔️ **Choose fights wisely** - Not every engagement is worth the risk",
    "🔋 **Resource management** - Keep track of ammo and healing items",
    "🤝 **Communication** - Call out threats and loot for your team",
    "🏠 **Use cover** - The ARC have superior firepower, use the environment",
    "⏰ **Time your raids** - Some areas are safer at certain times"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tips')
        .setDescription('Get random tips for ARC Raiders')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of tips')
                .setRequired(false)
                .addChoices(
                    { name: '🎮 Gameplay Tips', value: 'gameplay' },
                    { name: '🔧 Attachment Tips', value: 'attachments' },
                    { name: '📚 All Tips', value: 'all' }
                )),
    
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'all';
        
        let tips = [];
        let title = '';
        
        switch(type) {
            case 'gameplay':
                tips = gameTips;
                title = '🎮 Gameplay Tips';
                break;
            case 'attachments':
                tips = attachmentTips;
                title = '🔧 Attachment Tips';
                break;
            default:
                tips = [...gameTips, ...attachmentTips];
                title = '📚 ARC Raiders Tips';
        }

        const randomTips = tips
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        const embed = new EmbedBuilder()
            .setColor(0x9933FF)
            .setTitle(title)
            .setDescription(randomTips.join('\n\n'))
            .setFooter({ text: 'Use /tips again for more tips!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

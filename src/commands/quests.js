const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { questGuide } = require('../data/meta.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Quest guides and completion tips')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Which quests?')
                .setRequired(false)
                .addChoices(
                    { name: '📅 Daily Quests', value: 'daily' },
                    { name: '📆 Weekly Quests', value: 'weekly' },
                    { name: '💡 Quest Tips', value: 'tips' }
                )),
    
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'daily';

        if (type === 'daily') {
            const questList = questGuide.daily.map(q => 
                `**${q.name}**\n` +
                `📋 Task: ${q.task}\n` +
                `🎁 Reward: ${q.reward}\n` +
                `💡 Tip: ${q.tip}`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle('📅 Daily Quests Guide')
                .setDescription(questList)
                .addFields({
                    name: '⏰ Reset Time',
                    value: 'Daily quests reset at **00:00 UTC**',
                    inline: false
                })
                .setFooter({ text: 'Complete all dailies for ~2300 XP per day!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (type === 'weekly') {
            const questList = questGuide.weekly.map(q => 
                `**${q.name}**\n` +
                `📋 Task: ${q.task}\n` +
                `🎁 Reward: ${q.reward}\n` +
                `💡 Tip: ${q.tip}`
            ).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor(0xFF6600)
                .setTitle('📆 Weekly Quests Guide')
                .setDescription(questList)
                .addFields({
                    name: '⏰ Reset Time',
                    value: 'Weekly quests reset **Monday 00:00 UTC**',
                    inline: false
                })
                .setFooter({ text: 'Weekly quests give 25,500+ XP total!' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (type === 'tips') {
            const embed = new EmbedBuilder()
                .setColor(0x9933FF)
                .setTitle('💡 Quest Completion Tips')
                .setDescription(questGuide.tips.join('\n\n'))
                .addFields({
                    name: '🎯 Pro Strategy',
                    value: 'Stack multiple quests in one run! Example: Kill 5 (First Blood) + Extract 3 (Survivor) + Loot 20 (Scavenger) can be done in 3 quick runs.',
                    inline: false
                })
                .setFooter({ text: 'Use /quests type:daily or type:weekly for specific guides' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};

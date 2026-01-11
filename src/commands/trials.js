const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { trialsGuide } = require('../data/meta.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trials')
        .setDescription('Tips for fast ranking and trials progression')
        .addStringOption(option =>
            option.setName('info')
                .setDescription('What info do you need?')
                .setRequired(false)
                .addChoices(
                    { name: '⚡ Fast Rank Methods', value: 'fastrank' },
                    { name: '💡 General Tips', value: 'tips' },
                    { name: '📊 Rank Unlocks', value: 'ranks' }
                )),
    
    async execute(interaction) {
        const info = interaction.options.getString('info') || 'tips';

        if (info === 'tips') {
            const embed = new EmbedBuilder()
                .setColor(0x9933FF)
                .setTitle('💡 Trials Ranking Tips')
                .setDescription('Best tips to level up fast in ARC Raiders')
                .addFields({
                    name: '🎯 Top Tips',
                    value: trialsGuide.tips.join('\n\n'),
                    inline: false
                })
                .setFooter({ text: 'Use /trials info:fastrank for XP farming methods' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (info === 'fastrank') {
            const embeds = trialsGuide.fastRank.map((method, index) => {
                const colors = [0x00FF00, 0xFFFF00, 0xFF6600];
                return new EmbedBuilder()
                    .setColor(colors[index] || 0x00AAFF)
                    .setTitle(`⚡ ${method.method}`)
                    .setDescription(method.description)
                    .addFields(
                        { name: '📈 XP Rate', value: method.xpPerHour, inline: true },
                        { name: '📋 Steps', value: method.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'), inline: false }
                    )
                    .setTimestamp();
            });

            await interaction.reply({
                content: '## ⚡ Fast Ranking Methods - Sorted by XP/Hour',
                embeds: embeds
            });
            return;
        }

        if (info === 'ranks') {
            const rankList = trialsGuide.ranks
                .map(r => `**Rank ${r.rank}** (${r.xpNeeded.toLocaleString()} XP) → ${r.unlock}`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📊 Rank Progression & Unlocks')
                .setDescription(rankList)
                .addFields({
                    name: '💡 Tip',
                    value: 'Focus on reaching Rank 10 first for SMGs - they dominate early game!',
                    inline: false
                })
                .setFooter({ text: 'Use /trials info:fastrank to level up quickly' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};

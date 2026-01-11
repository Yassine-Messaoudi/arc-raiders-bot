const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { metaLoadouts } = require('../data/meta.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meta')
        .setDescription('See the best weapons and meta loadouts')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('What meta info do you want?')
                .setRequired(false)
                .addChoices(
                    { name: '🏆 Tier List', value: 'tierlist' },
                    { name: '⚔️ Best for PvP', value: 'pvp' },
                    { name: '🤖 Best for PvE', value: 'pve' },
                    { name: '🎒 Best for Extraction', value: 'extraction' },
                    { name: '🆕 Beginner Loadout', value: 'beginner' },
                    { name: '🆓 Free Loadouts', value: 'free' }
                )),
    
    async execute(interaction) {
        const type = interaction.options.getString('type') || 'tierlist';

        if (type === 'tierlist') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 ARC Raiders Weapon Tier List')
                .setDescription('Current meta rankings based on performance')
                .addFields(
                    {
                        name: '🥇 S-TIER (Best)',
                        value: metaLoadouts.tierList.S.map(w => `**${w.name}** (${w.type})\n└ ${w.reason}`).join('\n\n'),
                        inline: false
                    },
                    {
                        name: '🥈 A-TIER (Strong)',
                        value: metaLoadouts.tierList.A.map(w => `**${w.name}** (${w.type})\n└ ${w.reason}`).join('\n\n'),
                        inline: false
                    },
                    {
                        name: '🥉 B-TIER (Viable)',
                        value: metaLoadouts.tierList.B.map(w => `**${w.name}** (${w.type})\n└ ${w.reason}`).join('\n\n'),
                        inline: false
                    },
                    {
                        name: '⬜ C-TIER (Situational)',
                        value: metaLoadouts.tierList.C.map(w => `**${w.name}** (${w.type})\n└ ${w.reason}`).join('\n\n'),
                        inline: false
                    }
                )
                .setFooter({ text: 'Use /meta type:pvp for specific recommendations' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (type === 'free') {
            const embeds = metaLoadouts.freeLoadouts.map(loadout => {
                return new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`🆓 ${loadout.name}`)
                    .setDescription(loadout.description)
                    .addFields(
                        { name: '🔫 Weapons', value: loadout.weapons.join(' + '), inline: true },
                        { name: '⭐ Perks', value: loadout.perks.join(', '), inline: true },
                        { name: '📊 Difficulty', value: loadout.difficulty, inline: true }
                    )
                    .setTimestamp();
            });

            await interaction.reply({ 
                content: '## 🆓 Free Meta Loadouts - No Rare Items Needed!',
                embeds: embeds 
            });
            return;
        }

        const bestFor = metaLoadouts.bestFor[type];
        if (bestFor) {
            const typeNames = {
                pvp: '⚔️ PvP Combat',
                pve: '🤖 PvE / ARC Hunting',
                extraction: '🎒 Extraction Runs',
                beginner: '🆕 Beginner Friendly'
            };

            const embed = new EmbedBuilder()
                .setColor(0x00AAFF)
                .setTitle(`${typeNames[type]} - Best Loadout`)
                .addFields(
                    { name: '🔫 Primary Weapon', value: bestFor.primary, inline: true },
                    { name: '🔧 Secondary', value: bestFor.secondary, inline: true },
                    { name: '💡 Why?', value: bestFor.reason, inline: false }
                )
                .setFooter({ text: 'Use /loadout weapon:<name> for attachment details' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};

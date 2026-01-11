const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { weapons } = require('../data/weapons.js');

function createWeaponEmbed(weapon, username) {
    const attachmentList = weapon.attachments
        .map(att => `**${att.slot}:** ${att.item}`)
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: username })
        .setTitle(`🎮 ${weapon.name} (${weapon.type}) - ${weapon.range} - ${weapon.meta}`)
        .setDescription(attachmentList)
        .setImage(weapon.image)
        .setTimestamp()
        .setFooter({ text: 'ARC Raiders Loadouts' });

    return embed;
}

function createButtons(currentIndex, totalWeapons) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('loadout_back')
                .setLabel('< BACK')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === 0),
            new ButtonBuilder()
                .setCustomId('loadout_list')
                .setLabel('All Loadouts')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('loadout_next')
                .setLabel('NEXT >')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentIndex === totalWeapons - 1)
        );
    return row;
}

function createWeaponSelect() {
    const options = weapons.map(w => ({
        label: w.name,
        description: `${w.type} - ${w.range}`,
        value: w.id
    }));

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('weapon_select')
                .setPlaceholder('Select a weapon...')
                .addOptions(options)
        );
    return row;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loadout')
        .setDescription('Get weapon attachment suggestions for ARC Raiders')
        .addStringOption(option =>
            option.setName('weapon')
                .setDescription('Select a specific weapon')
                .setRequired(false)
                .addChoices(
                    ...weapons.map(w => ({ name: `${w.name} (${w.type})`, value: w.id }))
                )),
    
    async execute(interaction) {
        const weaponId = interaction.options.getString('weapon');
        const username = interaction.user.username;

        if (!weaponId) {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎮 ARC Raiders Loadouts')
                .setDescription('Select a weapon from the menu below or use `/loadout weapon:<name>`')
                .addFields(
                    { 
                        name: '📋 Available Weapons', 
                        value: weapons.map(w => `• **${w.name}** (${w.type})`).join('\n'),
                        inline: false 
                    }
                )
                .setFooter({ text: 'ARC Raiders Bot' })
                .setTimestamp();

            const selectRow = createWeaponSelect();
            await interaction.reply({ embeds: [embed], components: [selectRow] });
            return;
        }

        const weapon = weapons.find(w => w.id === weaponId);
        if (!weapon) {
            await interaction.reply({ content: 'Weapon not found!', ephemeral: true });
            return;
        }

        const currentIndex = weapons.findIndex(w => w.id === weaponId);
        const embed = createWeaponEmbed(weapon, username);
        const buttons = createButtons(currentIndex, weapons.length);

        await interaction.reply({ embeds: [embed], components: [buttons] });
    }
};

module.exports.createWeaponEmbed = createWeaponEmbed;
module.exports.createButtons = createButtons;
module.exports.weapons = weapons;

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { updateAllData } = require('./services/dataFetcher.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    client.user.setActivity('ARC Raiders', { type: ActivityType.Playing });

    await updateAllData();

    cron.schedule('0 */6 * * *', async () => {
        console.log('🔄 Scheduled data update running...');
        await updateAllData();
    });
    console.log('⏰ Auto-update scheduled every 6 hours');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const reply = { content: 'There was an error executing this command!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
        return;
    }

    if (interaction.isButton()) {
        const { createWeaponEmbed, createButtons, weapons } = require('./commands/loadout.js');
        const currentEmbed = interaction.message.embeds[0];
        const title = currentEmbed?.title || '';
        
        const currentWeapon = weapons.find(w => title.includes(w.name));
        let currentIndex = currentWeapon ? weapons.findIndex(w => w.id === currentWeapon.id) : 0;

        if (interaction.customId === 'loadout_back') {
            currentIndex = Math.max(0, currentIndex - 1);
        } else if (interaction.customId === 'loadout_next') {
            currentIndex = Math.min(weapons.length - 1, currentIndex + 1);
        } else if (interaction.customId === 'loadout_list') {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎮 ARC Raiders Loadouts')
                .setDescription('Select a weapon from the menu below')
                .addFields({
                    name: '📋 Available Weapons',
                    value: weapons.map(w => `• **${w.name}** (${w.type})`).join('\n'),
                    inline: false
                })
                .setFooter({ text: 'ARC Raiders Bot' })
                .setTimestamp();

            const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
            const selectRow = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('weapon_select')
                        .setPlaceholder('Select a weapon...')
                        .addOptions(weapons.map(w => ({
                            label: w.name,
                            description: `${w.type} - ${w.range}`,
                            value: w.id
                        })))
                );
            await interaction.update({ embeds: [embed], components: [selectRow] });
            return;
        }

        const weapon = weapons[currentIndex];
        const embed = createWeaponEmbed(weapon, interaction.user.username);
        const buttons = createButtons(currentIndex, weapons.length);
        await interaction.update({ embeds: [embed], components: [buttons] });
        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'weapon_select') {
        const { createWeaponEmbed, createButtons, weapons } = require('./commands/loadout.js');
        const weaponId = interaction.values[0];
        const weapon = weapons.find(w => w.id === weaponId);
        
        if (weapon) {
            const currentIndex = weapons.findIndex(w => w.id === weaponId);
            const embed = createWeaponEmbed(weapon, interaction.user.username);
            const buttons = createButtons(currentIndex, weapons.length);
            await interaction.update({ embeds: [embed], components: [buttons] });
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === 'news_refresh') {
        await interaction.deferUpdate();
        const { getCachedData, getLastUpdated, updateAllData } = require('./services/dataFetcher.js');
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        await updateAllData();
        const cachedData = getCachedData();
        
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('📰 ARC Raiders News')
            .setDescription('Latest news and updates from the community')
            .setTimestamp()
            .setFooter({ text: `Last updated: ${getLastUpdated()}` });

        cachedData.news.slice(0, 8).forEach((item, index) => {
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

        await interaction.editReply({ embeds: [embed], components: [row] });
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);

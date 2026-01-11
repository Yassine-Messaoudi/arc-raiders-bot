const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { updateAllData } = require('./services/dataFetcher.js');
const { checkAndPostRedditNews, postNightStreams } = require('./services/alertsService.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

client.on('error', (error) => {
    console.error('Discord client error:', error);
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

    try {
        await checkAndPostRedditNews(client, { force: false });
    } catch (e) {
        console.error('Alerts: initial Reddit check failed:', e);
    }

    cron.schedule('0 */6 * * *', async () => {
        console.log('🔄 Scheduled data update running...');
        await updateAllData();
    });
    console.log('⏰ Auto-update scheduled every 6 hours');

    cron.schedule('*/15 * * * *', async () => {
        try {
            await checkAndPostRedditNews(client, { force: false });
        } catch (e) {
            console.error('Alerts: Reddit autopost failed:', e);
        }
    });
    console.log('🔔 Alerts: Reddit autopost scheduled every 15 minutes');

    cron.schedule('0 21 * * *', async () => {
        try {
            await postNightStreams(client, { force: false });
        } catch (e) {
            console.error('Alerts: nightly streams post failed:', e);
        }
    });
    console.log('🌙 Alerts: Night streams scheduled at 21:00');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || typeof command.autocomplete !== 'function') return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
        return;
    }

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const reply = { content: 'There was an error executing this command!', ephemeral: true };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch (e) {
                const code = e?.code;
                if (code !== 10062 && code !== 40060) {
                    console.error('Failed to send error reply:', e);
                }
            }
        }
        return;
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'news_refresh') {
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

        if (interaction.customId === 'quest_back') {
            const { handleQuestBack } = require('./commands/quests.js');
            await handleQuestBack(interaction);
            return;
        }

        if (interaction.customId === 'help_refresh_wiki') {
            await interaction.deferReply({ ephemeral: true });
            const { updateWikiCache } = require('./services/wikiFetcher.js');
            await updateWikiCache({ force: true });
            await interaction.editReply('✅ Wiki database refreshed.');
            return;
        }

        if (interaction.customId === 'help_weapons' || interaction.customId === 'help_quests') {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder().setColor(0x00AAFF).setTimestamp();

            if (interaction.customId === 'help_weapons') {
                embed
                    .setTitle('🔫 Weapons - Quick Guide')
                    .setDescription([
                        '`/items category:Weapons` (browse all weapons)',
                        '`/db query:<weapon>` (search any weapon)',
                        '`/loadout weapon:<weapon>` (best attachments + wiki link)'
                    ].join('\n'));
            } else {
                embed
                    .setTitle('📋 Quests - Quick Guide')
                    .setDescription([
                        '`/quests` (browse quests with pictures)',
                        '`/quests query:<quest>` (search quest)',
                        '`/db category:Quests` (full quest database)'
                    ].join('\n'));
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (interaction.customId.startsWith('loadout_')) {
            const { createWeaponEmbed, createButtons, getWeapons } = require('./commands/loadout.js');
            const weapons = getWeapons();
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
                const sortedWeapons = weapons.slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
                const shown = sortedWeapons.slice(0, 25);
                const remainder = Math.max(0, sortedWeapons.length - shown.length);

                const embed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🎮 ARC Raiders Loadouts')
                    .setDescription('Select a weapon from the menu below')
                    .addFields({
                        name: '📋 Available Weapons',
                        value: weapons.length
                            ? `${shown.map(w => `• **${w.name}**`).join('\n')}${remainder ? `\n\n…and ${remainder} more. Type \/loadout weapon:<name>` : ''}`
                            : 'No weapons found. Run `/db refresh:true`.',
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
                            .addOptions(shown.map(w => ({
                                label: w.name,
                                description: 'ARC Raiders Wiki weapon',
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

        return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'weapon_select') {
        const { createWeaponEmbed, createButtons, getWeapons } = require('./commands/loadout.js');
        const weapons = getWeapons();
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

    if (interaction.isStringSelectMenu() && interaction.customId === 'quest_select') {
        const { handleQuestSelect } = require('./commands/quests.js');
        await handleQuestSelect(interaction);
        return;
    }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ Missing DISCORD_TOKEN env var. Set it in your environment (hosting dashboard) or .env file.');
    process.exit(1);
}

client.login(token).catch((err) => {
    console.error('❌ Discord login failed:', err);
    process.exit(1);
});

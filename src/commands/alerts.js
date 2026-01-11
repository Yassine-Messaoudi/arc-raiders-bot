const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');

const {
    getAlertsConfig,
    setAlertsConfig,
    postNightStreams,
    checkAndPostRedditNews
} = require('../services/alertsService.js');

function isValidUrl(u) {
    try {
        const url = new URL(String(u || '').trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function statusEmbed(cfg) {
    const embed = new EmbedBuilder()
        .setColor(0x00AAFF)
        .setTitle('🔔 Alerts Status')
        .addFields(
            { name: 'Enabled', value: cfg.enabled ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Reddit Channel', value: cfg.redditChannelId ? `<#${cfg.redditChannelId}>` : '—', inline: true },
            { name: 'Reddit @everyone', value: cfg.redditPingEveryone ? '✅ On' : '❌ Off', inline: true },
            { name: 'Reddit Enabled', value: cfg.redditEnabled ? '✅ On' : '❌ Off', inline: true },
            { name: 'Twitch Channel', value: cfg.twitchChannelId ? `<#${cfg.twitchChannelId}>` : '—', inline: true },
            { name: 'Twitch @everyone', value: cfg.twitchPingEveryone ? '✅ On' : '❌ Off', inline: true },
            { name: 'Twitch Enabled', value: cfg.twitchEnabled ? '✅ On' : '❌ Off', inline: true }
        )
        .setTimestamp();

    embed.addFields({
        name: 'Twitch Settings',
        value: [
            `- **Game:** ${cfg.twitchGameName || 'ARC Raiders'}`,
            `- **Top Count:** ${cfg.twitchTopCount || 5}`
        ].join('\n'),
        inline: false
    });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alerts')
        .setDescription('Configure auto-post alerts (Twitch + Reddit)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub
                .setName('status')
                .setDescription('Show current alerts configuration')
        )
        .addSubcommand(sub =>
            sub
                .setName('enable')
                .setDescription('Enable or disable all alerts')
                .addBooleanOption(opt =>
                    opt
                        .setName('enabled')
                        .setDescription('Enable/disable')
                        .setRequired(true)
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('reddit')
                .setDescription('Configure Reddit auto-posting')
                .addSubcommand(sub =>
                    sub
                        .setName('channel')
                        .setDescription('Set the channel where Reddit news will be posted')
                        .addChannelOption(opt =>
                            opt
                                .setName('channel')
                                .setDescription('Target text channel')
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('enabled')
                        .setDescription('Enable or disable Reddit auto-posting')
                        .addBooleanOption(opt =>
                            opt
                                .setName('enabled')
                                .setDescription('Enable/disable')
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('everyone')
                        .setDescription('Toggle @everyone for Reddit posts')
                        .addBooleanOption(opt =>
                            opt
                                .setName('enabled')
                                .setDescription('If true, bot pings @everyone on Reddit posts')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('twitch')
                .setDescription('Configure Twitch top-stream posts')
                .addSubcommand(sub =>
                    sub
                        .setName('channel')
                        .setDescription('Set the channel where Twitch posts will be sent')
                        .addChannelOption(opt =>
                            opt
                                .setName('channel')
                                .setDescription('Target text channel')
                                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('enabled')
                        .setDescription('Enable or disable Twitch posts')
                        .addBooleanOption(opt =>
                            opt
                                .setName('enabled')
                                .setDescription('Enable/disable')
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('everyone')
                        .setDescription('Toggle @everyone for Twitch posts')
                        .addBooleanOption(opt =>
                            opt
                                .setName('enabled')
                                .setDescription('If true, bot pings @everyone on Twitch posts')
                                .setRequired(true)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('top')
                        .setDescription('How many top ARC Raiders streams to include (1-10)')
                        .addIntegerOption(opt =>
                            opt
                                .setName('count')
                                .setDescription('Number of streams')
                                .setRequired(true)
                                .setMinValue(1)
                                .setMaxValue(10)
                        )
                )
                .addSubcommand(sub =>
                    sub
                        .setName('game')
                        .setDescription('Twitch category name (default: ARC Raiders)')
                        .addStringOption(opt =>
                            opt
                                .setName('name')
                                .setDescription('Game/category name on Twitch')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup(group =>
            group
                .setName('test')
                .setDescription('Send a test post now')
                .addSubcommand(sub =>
                    sub
                        .setName('reddit')
                        .setDescription('Test Reddit autopost (force)')
                )
                .addSubcommand(sub =>
                    sub
                        .setName('streams')
                        .setDescription('Test night streams post (force)')
                )
        ),

    async execute(interaction) {
        const cfg = getAlertsConfig();
        const sub = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);

        if (sub === 'status' && !group) {
            await interaction.reply({ embeds: [statusEmbed(cfg)], ephemeral: true });
            return;
        }

        if (sub === 'enable' && !group) {
            const enabled = interaction.options.getBoolean('enabled', true);
            setAlertsConfig({ enabled });
            await interaction.reply({ content: `✅ Alerts are now **${enabled ? 'ENABLED' : 'DISABLED'}**`, ephemeral: true });
            return;
        }

        if (group === 'reddit' && sub === 'channel') {
            const channel = interaction.options.getChannel('channel', true);
            setAlertsConfig({ redditChannelId: channel.id });
            await interaction.reply({ content: `✅ Reddit channel set to <#${channel.id}>`, ephemeral: true });
            return;
        }

        if (group === 'reddit' && sub === 'enabled') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setAlertsConfig({ redditEnabled: enabled });
            await interaction.reply({ content: `✅ Reddit auto-post is now **${enabled ? 'ON' : 'OFF'}**`, ephemeral: true });
            return;
        }

        if (group === 'reddit' && sub === 'everyone') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setAlertsConfig({ redditPingEveryone: enabled });
            await interaction.reply({ content: `✅ Reddit @everyone ping is now **${enabled ? 'ON' : 'OFF'}**`, ephemeral: true });
            return;
        }

        if (group === 'twitch' && sub === 'channel') {
            const channel = interaction.options.getChannel('channel', true);
            setAlertsConfig({ twitchChannelId: channel.id });
            await interaction.reply({ content: `✅ Twitch channel set to <#${channel.id}>`, ephemeral: true });
            return;
        }

        if (group === 'twitch' && sub === 'enabled') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setAlertsConfig({ twitchEnabled: enabled });
            await interaction.reply({ content: `✅ Twitch posts are now **${enabled ? 'ON' : 'OFF'}**`, ephemeral: true });
            return;
        }

        if (group === 'twitch' && sub === 'everyone') {
            const enabled = interaction.options.getBoolean('enabled', true);
            setAlertsConfig({ twitchPingEveryone: enabled });
            await interaction.reply({ content: `✅ Twitch @everyone ping is now **${enabled ? 'ON' : 'OFF'}**`, ephemeral: true });
            return;
        }

        if (group === 'twitch' && sub === 'top') {
            const count = interaction.options.getInteger('count', true);
            setAlertsConfig({ twitchTopCount: count });
            await interaction.reply({ content: `✅ Twitch top streams count set to **${count}**`, ephemeral: true });
            return;
        }

        if (group === 'twitch' && sub === 'game') {
            const name = interaction.options.getString('name', true).trim();
            setAlertsConfig({ twitchGameName: name });
            await interaction.reply({ content: `✅ Twitch category set to **${name}**`, ephemeral: true });
            return;
        }

        if (group === 'test' && sub === 'reddit') {
            await interaction.reply({ content: '✅ Sending test Reddit post...', ephemeral: true });
            await checkAndPostRedditNews(interaction.client, { force: true });
            return;
        }

        if (group === 'test' && sub === 'streams') {
            await interaction.reply({ content: '✅ Sending test streams post...', ephemeral: true });
            await postNightStreams(interaction.client, { force: true });
            return;
        }

        await interaction.reply({ content: 'Unknown alerts command option.', ephemeral: true });
    }
};

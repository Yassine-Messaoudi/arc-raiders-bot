const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCachedData, updateCachedData, fetchRedditNews } = require('./dataFetcher.js');
const { getTopStreamsForGame, hasTwitchCreds } = require('./twitchService.js');

function defaultAlerts() {
    return {
        enabled: true,
        redditChannelId: null,
        redditPingEveryone: false,
        redditEnabled: true,
        twitchChannelId: null,
        twitchPingEveryone: false,
        twitchEnabled: true,
        twitchGameName: 'ARC Raiders',
        twitchTopCount: 5,
        lastRedditUrl: null,
        lastTwitchDay: null
    };
}

function getAlertsConfig() {
    const cache = getCachedData();
    const defaults = defaultAlerts();
    const cfg = cache?.alerts && typeof cache.alerts === 'object' ? cache.alerts : {};

    const merged = { ...defaults, ...cfg };

    if (cfg.channelId && !cfg.redditChannelId) merged.redditChannelId = cfg.channelId;
    if (cfg.channelId && !cfg.twitchChannelId) merged.twitchChannelId = cfg.channelId;
    if (typeof cfg.pingEveryone === 'boolean' && typeof cfg.redditPingEveryone !== 'boolean') {
        merged.redditPingEveryone = cfg.pingEveryone;
    }
    if (typeof cfg.pingEveryone === 'boolean' && typeof cfg.twitchPingEveryone !== 'boolean') {
        merged.twitchPingEveryone = cfg.pingEveryone;
    }
    if (typeof cfg.redditEnabled === 'boolean') merged.redditEnabled = cfg.redditEnabled;
    if (typeof cfg.streamsEnabled === 'boolean') merged.twitchEnabled = cfg.streamsEnabled;
    if (cfg.lastStreamsDay && !cfg.lastTwitchDay) merged.lastTwitchDay = cfg.lastStreamsDay;

    if (!Number.isFinite(Number(merged.twitchTopCount))) merged.twitchTopCount = defaults.twitchTopCount;
    merged.twitchTopCount = Math.max(1, Math.min(10, Number(merged.twitchTopCount) || defaults.twitchTopCount));
    merged.twitchGameName = String(merged.twitchGameName || defaults.twitchGameName).trim() || defaults.twitchGameName;

    return merged;
}

function setAlertsConfig(patch) {
    updateCachedData((d) => {
        const cur = d.alerts && typeof d.alerts === 'object' ? d.alerts : {};
        const next = { ...defaultAlerts(), ...cur, ...patch };
        if (!Number.isFinite(Number(next.twitchTopCount))) next.twitchTopCount = defaultAlerts().twitchTopCount;
        next.twitchTopCount = Math.max(1, Math.min(10, Number(next.twitchTopCount) || defaultAlerts().twitchTopCount));
        next.twitchGameName = String(next.twitchGameName || defaultAlerts().twitchGameName).trim() || defaultAlerts().twitchGameName;
        d.alerts = next;
    });
}

function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

async function getTargetChannel(client, channelId) {
    if (!channelId) return null;
    try {
        const ch = await client.channels.fetch(channelId);
        if (!ch || !ch.isTextBased()) return null;
        return ch;
    } catch {
        return null;
    }
}

function makeTwitchEmbed(gameName, streams) {
    const embed = new EmbedBuilder()
        .setColor(0x9146FF)
        .setTitle(`🟣 Top ${gameName} Streams (Twitch)`)
        .setDescription('Top live channels right now')
        .setTimestamp();

    const top = streams?.[0];
    if (top?.thumbnail) {
        embed.setImage(top.thumbnail);
    }

    (streams || []).slice(0, 5).forEach((s, idx) => {
        const name = String(s?.userName || '').trim() || `Streamer ${idx + 1}`;
        const viewers = Number.isFinite(Number(s?.viewerCount)) ? Number(s.viewerCount).toLocaleString() : '—';
        const title = String(s?.title || '').trim();
        const url = String(s?.url || '').trim();

        embed.addFields({
            name: `${idx + 1}. ${name} — 👁️ ${viewers}`,
            value: [
                title ? `**${title.slice(0, 200)}**` : null,
                url ? `[Watch on Twitch](${url})` : null
            ].filter(Boolean).join('\n'),
            inline: false
        });
    });

    return embed;
}

function makeTwitchButtons(streams) {
    const rows = [];
    let row = new ActionRowBuilder();

    for (const s of (streams || []).slice(0, 5)) {
        const name = String(s?.userName || '').trim();
        const url = String(s?.url || '').trim();
        if (!name || !url) continue;

        if (row.components.length >= 5) {
            rows.push(row);
            row = new ActionRowBuilder();
        }

        row.addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(name.slice(0, 80))
                .setURL(url)
        );
    }

    if (row.components.length) rows.push(row);
    return rows.slice(0, 5);
}

async function postNightStreams(client, { force = false } = {}) {
    const cfg = getAlertsConfig();
    if (!cfg.enabled || !cfg.twitchEnabled) return;

    const channel = await getTargetChannel(client, cfg.twitchChannelId);
    if (!channel) return;

    const key = todayKey();
    if (!force && cfg.lastTwitchDay === key) return;

    if (!hasTwitchCreds()) {
        console.log('⚠️ Twitch alerts: missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET');
        return;
    }

    const gameName = cfg.twitchGameName || 'ARC Raiders';
    const { ok, streams } = await getTopStreamsForGame(gameName, cfg.twitchTopCount);
    if (!ok || !streams?.length) return;

    const embed = makeTwitchEmbed(gameName, streams);
    const components = makeTwitchButtons(streams);

    const content = cfg.twitchPingEveryone ? '@everyone' : undefined;
    await channel.send({
        content,
        embeds: [embed],
        components,
        allowedMentions: cfg.twitchPingEveryone ? { parse: ['everyone'] } : { parse: [] }
    });

    setAlertsConfig({ lastTwitchDay: key });
}

function makeRedditEmbed(item) {
    const title = String(item?.title || '').trim() || 'ARC Raiders Reddit';
    const url = String(item?.url || '').trim();

    const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle(`🟥 ${title.slice(0, 256)}`)
        .setTimestamp();

    if (url) embed.setURL(url);

    const image = String(item?.image || '').trim();
    if (image) {
        embed.setImage(image);
    }

    const lines = [];
    if (item?.date) lines.push(`📅 ${item.date}`);
    if (typeof item?.score === 'number') lines.push(`⬆️ ${item.score}`);
    if (lines.length) embed.setDescription(lines.join(' • '));

    embed.setFooter({ text: 'r/ArcRaiders' });

    return embed;
}

function makeRedditButtons(item) {
    const url = String(item?.url || '').trim();
    if (!url) return [];
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Open on Reddit')
                .setURL(url)
        )
    ];
}

async function checkAndPostRedditNews(client, { force = false } = {}) {
    const cfg = getAlertsConfig();
    if (!cfg.enabled || !cfg.redditEnabled) return;

    const channel = await getTargetChannel(client, cfg.redditChannelId);
    if (!channel) return;

    const items = await fetchRedditNews();
    if (!Array.isArray(items) || !items.length) return;

    const newestUrl = items[0]?.url || null;
    if (!newestUrl) return;

    if (!force && !cfg.lastRedditUrl) {
        setAlertsConfig({ lastRedditUrl: newestUrl });
        return;
    }

    const toPost = [];
    for (const it of items) {
        if (!it?.url) continue;
        if (it.url === cfg.lastRedditUrl) break;
        toPost.push(it);
    }

    if (!toPost.length) return;

    toPost.reverse();

    const content = cfg.redditPingEveryone ? '@everyone' : undefined;
    let first = true;
    for (const it of toPost.slice(0, 5)) {
        const embed = makeRedditEmbed(it);
        const components = makeRedditButtons(it);
        await channel.send({
            content: first ? content : undefined,
            embeds: [embed],
            components,
            allowedMentions: cfg.redditPingEveryone ? { parse: ['everyone'] } : { parse: [] }
        });
        first = false;
    }

    setAlertsConfig({ lastRedditUrl: newestUrl });
}

module.exports = {
    defaultAlerts,
    getAlertsConfig,
    setAlertsConfig,
    postNightStreams,
    checkAndPostRedditNews
};

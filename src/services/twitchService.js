const axios = require('axios');

let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

function hasTwitchCreds() {
    return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

async function getAppAccessToken() {
    if (!hasTwitchCreds()) return null;

    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiresAt - 60_000 > now) {
        return tokenCache.accessToken;
    }

    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
    });

    const res = await axios.post('https://id.twitch.tv/oauth2/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
    });

    const accessToken = res.data?.access_token || null;
    const expiresIn = Number(res.data?.expires_in || 0);

    if (!accessToken || !expiresIn) return null;

    tokenCache.accessToken = accessToken;
    tokenCache.expiresAt = Date.now() + expiresIn * 1000;
    return accessToken;
}

async function twitchGet(path, query) {
    const token = await getAppAccessToken();
    if (!token) return null;

    const res = await axios.get(`https://api.twitch.tv/helix/${path}`, {
        params: query,
        timeout: 15000,
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${token}`
        }
    });

    return res.data;
}

async function getGameIdByName(name) {
    const data = await twitchGet('games', { name });
    const game = data?.data?.[0];
    return game?.id || null;
}

async function getTopStreamsForGame(gameName, count = 5) {
    if (!hasTwitchCreds()) return { ok: false, reason: 'missing_creds', streams: [] };

    const gameId = await getGameIdByName(gameName);
    if (!gameId) return { ok: false, reason: 'game_not_found', streams: [] };

    const data = await twitchGet('streams', {
        game_id: gameId,
        first: Math.max(1, Math.min(20, Number(count) || 5))
    });

    const streams = (data?.data || []).map((s) => {
        const thumb = s?.thumbnail_url
            ? String(s.thumbnail_url)
                .replace('{width}', '1280')
                .replace('{height}', '720')
            : null;

        return {
            id: s?.id || null,
            userName: s?.user_name || null,
            userLogin: s?.user_login || null,
            title: s?.title || null,
            viewerCount: s?.viewer_count ?? null,
            startedAt: s?.started_at || null,
            thumbnail: thumb,
            url: s?.user_login ? `https://www.twitch.tv/${s.user_login}` : null
        };
    });

    return { ok: true, reason: null, streams };
}

module.exports = {
    hasTwitchCreds,
    getTopStreamsForGame
};

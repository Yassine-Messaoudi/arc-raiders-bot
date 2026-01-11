const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { updateWikiCache } = require('./wikiFetcher.js');

const CACHE_FILE = path.join(__dirname, '../data/cache.json');

const TRIALS_WIKI_APIS = [
    'https://arcraiders.wiki/w/api.php',
    'https://arcraiders.wiki/api.php'
];

const SOURCES = {
    metaforge: 'https://metaforge.app',
    metaforgeArc: 'https://metaforge.app/arc-raiders',
    reddit: 'https://www.reddit.com/r/ArcRaiders/new.json',
    official: 'https://www.arcraiders.com',
    trialsWiki: 'https://arcraiders.wiki/wiki/Trials'
};

function trialsWikiOrigin() {
    return new URL(SOURCES.trialsWiki).origin;
}

function wikiTitleFromUrl(url) {
    try {
        if (!url) return null;
        const u = new URL(url);
        const m = u.pathname.match(/\/wiki\/(.+)$/);
        if (!m) return null;
        return decodeURIComponent(m[1]).replace(/_/g, ' ');
    } catch {
        return null;
    }
}

function wikiUrlFromTitle(title) {
    const t = String(title || '').trim();
    if (!t) return null;
    const slug = encodeURIComponent(t.replace(/ /g, '_'));
    return `${trialsWikiOrigin()}/wiki/${slug}`;
}

let cachedData = {
    news: [],
    meta: {},
    loadouts: [],
    trials: null,
    wikiLastUpdated: null,
    lastUpdated: null
};

function isFresh(isoTimestamp, maxAgeMs) {
    if (!isoTimestamp) return false;
    const t = new Date(isoTimestamp).getTime();
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < maxAgeMs;
}

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            cachedData = JSON.parse(data);
            console.log('📁 Cache loaded successfully');
        }
    } catch (error) {
        console.log('⚠️ No cache found, using defaults');
    }
}

async function fetchWeeklyTrialsFromWiki() {
    try {
        const apiGet = async (params) => {
            let lastError = null;
            for (const apiUrl of TRIALS_WIKI_APIS) {
                try {
                    const response = await axios.get(apiUrl, {
                        params: {
                            format: 'json',
                            ...params
                        },
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'ArcRaidersBot/1.0 (Discord bot; trials sync)'
                        }
                    });
                    return response.data;
                } catch (e) {
                    lastError = e;
                }
            }
            throw lastError || new Error('No trials wiki API endpoints available');
        };

        const sectionsData = await apiGet({
            action: 'parse',
            page: 'Trials',
            prop: 'sections'
        });

        const sections = sectionsData?.parse?.sections || [];
        const section = sections.find(s => String(s?.line || '').trim().toLowerCase() === 'current trial week');
        const sectionIndex = section?.index;
        if (!sectionIndex) {
            console.log(`⚠️ Trials wiki: Current Trial Week section not found (sections=${sections.length})`);
            return null;
        }

        const htmlData = await apiGet({
            action: 'parse',
            page: 'Trials',
            section: sectionIndex,
            prop: 'text'
        });

        const html = htmlData?.parse?.text?.['*'] || '';
        if (!html) {
            console.log('⚠️ Trials wiki: empty section HTML');
            return null;
        }

        const $ = cheerio.load(html);

        const weekLabel = $('h4, h3').first().text().replace(/\s+/g, ' ').trim();
        const listEl = $('ul').first();
        if (!listEl.length) {
            console.log('⚠️ Trials wiki: list not found in Current Trial Week section');
            return null;
        }

        const trials = [];
        listEl.find('li').each((_, li) => {
            if (trials.length >= 5) return;
            const $li = $(li);
            const text = $li.text().replace(/\s+/g, ' ').trim();
            if (!text) return;

            const a = $li.find('a').first();
            const href = a.attr('href');
            const url = href ? new URL(href, SOURCES.trialsWiki).toString() : null;

            trials.push({ title: text, url });
        });

        if (!trials.length) {
            console.log('⚠️ Trials wiki: 0 trials parsed');
            return null;
        }

        const headerImageData = await apiGet({
            action: 'query',
            titles: 'Trials',
            prop: 'pageimages',
            pithumbsize: 512
        }).catch(() => null);

        let headerImage = null;
        try {
            const pages = headerImageData?.query?.pages;
            const firstKey = pages ? Object.keys(pages)[0] : null;
            headerImage = firstKey ? pages[firstKey]?.thumbnail?.source : null;
        } catch {
            headerImage = null;
        }

        const enrichedTrials = await Promise.all(trials.map(async (t) => {
            const rawTitle = String(t?.title || '').trim();
            const cleanedQuery = rawTitle.replace(/^\([^)]*\)\s*/g, '').trim();

            let pageTitle = wikiTitleFromUrl(t.url);
            let pageUrl = t.url;

            if (!pageTitle) {
                const searchData = await apiGet({
                    action: 'query',
                    list: 'search',
                    srsearch: cleanedQuery || rawTitle,
                    srlimit: 1
                }).catch(() => null);

                const hit = searchData?.query?.search?.[0]?.title;
                if (hit) {
                    pageTitle = hit;
                    pageUrl = wikiUrlFromTitle(hit);
                }
            }

            let image = null;
            if (pageTitle) {
                const imgData = await apiGet({
                    action: 'query',
                    titles: pageTitle,
                    prop: 'pageimages',
                    pithumbsize: 512
                }).catch(() => null);

                try {
                    const pages = imgData?.query?.pages;
                    const firstKey = pages ? Object.keys(pages)[0] : null;
                    image = firstKey ? pages[firstKey]?.thumbnail?.source : null;
                } catch {
                    image = null;
                }
            }

            return {
                title: rawTitle,
                url: pageUrl || null,
                image: image || null
            };
        }));

        console.log(`🏆 Trials: ${weekLabel || 'Current Trial Week'} (${enrichedTrials.length} trials)`);

        return {
            weekLabel: weekLabel || 'Current Trial Week',
            sourceUrl: SOURCES.trialsWiki,
            image: headerImage || null,
            trials: enrichedTrials,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.log('⚠️ Trials wiki fetch failed:', error.message);
        return null;
    }
}

function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2));
        console.log('💾 Cache saved');
    } catch (error) {
        console.error('❌ Failed to save cache:', error.message);
    }
}

function updateCachedData(updater) {
    try {
        if (typeof updater === 'function') {
            updater(cachedData);
        }
        saveCache();
        return cachedData;
    } catch (error) {
        console.error('❌ Failed to update cache:', error.message);
        return cachedData;
    }
}

async function fetchMetaforgeData() {
    try {
        console.log('🔍 Fetching from MetaForge...');
        const response = await axios.get(SOURCES.metaforgeArc, { 
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        
        const loadouts = [];
        const news = [];

        $('.loadout, .weapon-card, .meta-item, [class*="loadout"], [class*="weapon"]').each((i, el) => {
            const name = $(el).find('h2, h3, .name, .title').first().text().trim();
            const type = $(el).find('.type, .category, .weapon-type').first().text().trim();
            const link = $(el).find('a').first().attr('href');
            
            if (name) {
                loadouts.push({
                    name: name,
                    type: type || 'Weapon',
                    url: link?.startsWith('http') ? link : `${SOURCES.metaforge}${link || ''}`,
                    source: 'MetaForge'
                });
            }
        });

        $('article, .news, .update, .patch').each((i, el) => {
            const title = $(el).find('h2, h3, .title').first().text().trim();
            const link = $(el).find('a').first().attr('href');
            if (title) {
                news.push({
                    title: title,
                    url: link?.startsWith('http') ? link : `${SOURCES.metaforge}${link || ''}`,
                    date: 'Recent',
                    source: 'MetaForge'
                });
            }
        });

        console.log(`✅ MetaForge: Found ${loadouts.length} loadouts, ${news.length} news items`);
        return { loadouts, news };
    } catch (error) {
        console.log('⚠️ MetaForge fetch failed:', error.message);
        return { loadouts: [], news: [] };
    }
}

async function fetchRedditNews() {
    try {
        const response = await axios.get(SOURCES.reddit, {
            headers: { 'User-Agent': 'ArcRaidersBot/1.0' },
            timeout: 10000
        });
        
        const posts = response.data?.data?.children || [];
        return posts.slice(0, 5).map(post => {
            const d = post?.data || {};
            const permalink = d.permalink ? `https://reddit.com${d.permalink}` : null;
            const previewUrlRaw = d?.preview?.images?.[0]?.source?.url || null;
            const previewUrl = previewUrlRaw ? String(previewUrlRaw).replace(/&amp;/g, '&') : null;
            const thumbUrl = d.thumbnail && /^https?:\/\//.test(d.thumbnail) ? d.thumbnail : null;
            const image = previewUrl || thumbUrl || null;

            return {
                id: d.id || null,
                title: d.title,
                url: permalink,
                date: new Date(d.created_utc * 1000).toLocaleDateString(),
                source: 'Reddit',
                score: d.score,
                image
            };
        });
    } catch (error) {
        console.log('⚠️ Reddit fetch failed:', error.message);
        return [];
    }
}

async function updateAllData() {
    console.log('🔄 Updating ARC Raiders data from all sources...');
    
    const [metaforgeData, redditNews, wikiCache, weeklyTrials] = await Promise.all([
        fetchMetaforgeData(),
        fetchRedditNews(),
        updateWikiCache().catch(() => null),
        fetchWeeklyTrialsFromWiki()
    ]);

    if (wikiCache?.categories) {
        const weaponsCount = wikiCache.categories?.Weapons?.count ?? 0;
        const itemsCount = wikiCache.categories?.Items?.count ?? 0;
        const mapsCount = wikiCache.categories?.Maps?.count ?? 0;
        console.log(`📚 Wiki: ${weaponsCount} weapons, ${itemsCount} items, ${mapsCount} maps (cached)`);
    } else {
        console.log('⚠️ Wiki: update failed (using existing cache if present)');
    }

    cachedData.news = [...metaforgeData.news, ...redditNews].slice(0, 10);
    cachedData.loadouts = metaforgeData.loadouts;
    if (weeklyTrials?.trials?.length) {
        cachedData.trials = weeklyTrials;
    } else if (!cachedData.trials || !isFresh(cachedData.trials?.lastUpdated, 8 * 60 * 60 * 1000)) {
        cachedData.trials = cachedData.trials || null;
    }
    cachedData.wikiLastUpdated = wikiCache?.lastUpdated || cachedData.wikiLastUpdated;
    cachedData.lastUpdated = new Date().toISOString();
    
    saveCache();
    console.log('✅ Data update complete');
    return cachedData;
}

function getCachedData() {
    return cachedData;
}

function getLastUpdated() {
    return cachedData.lastUpdated 
        ? new Date(cachedData.lastUpdated).toLocaleString()
        : 'Never';
}

loadCache();

module.exports = {
    updateAllData,
    getCachedData,
    updateCachedData,
    getLastUpdated,
    fetchRedditNews,
    SOURCES
};

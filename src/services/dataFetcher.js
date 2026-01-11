const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../data/cache.json');

const SOURCES = {
    metaforge: 'https://metaforge.app',
    metaforgeArc: 'https://metaforge.app/arc-raiders',
    reddit: 'https://www.reddit.com/r/ArcRaiders/new.json',
    official: 'https://www.arcraiders.com'
};

let cachedData = {
    news: [],
    meta: {},
    loadouts: [],
    lastUpdated: null
};

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

function saveCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedData, null, 2));
        console.log('💾 Cache saved');
    } catch (error) {
        console.error('❌ Failed to save cache:', error.message);
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
        return posts.slice(0, 5).map(post => ({
            title: post.data.title,
            url: `https://reddit.com${post.data.permalink}`,
            date: new Date(post.data.created_utc * 1000).toLocaleDateString(),
            source: 'Reddit',
            score: post.data.score
        }));
    } catch (error) {
        console.log('⚠️ Reddit fetch failed:', error.message);
        return [];
    }
}

async function updateAllData() {
    console.log('🔄 Updating ARC Raiders data from all sources...');
    
    const [metaforgeData, redditNews] = await Promise.all([
        fetchMetaforgeData(),
        fetchRedditNews()
    ]);

    cachedData.news = [...metaforgeData.news, ...redditNews].slice(0, 10);
    cachedData.loadouts = metaforgeData.loadouts;
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
    getLastUpdated,
    fetchRedditNews,
    SOURCES
};

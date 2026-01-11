const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const WIKI_API = 'https://arc-raiders.fandom.com/api.php';
const CACHE_FILE = path.join(__dirname, '../data/wikiCache.json');

const DEFAULT_CATEGORIES = [
    'Weapons',
    'Attachments',
    'Items',
    'Maps',
    'Locations',
    'Quests',
    'Enemies',
    'Bosses',
    'Bots',
    'Gadgets',
    'Augments',
    'Ammunition',
    'Grenades & Explosives',
    'Medical',
    'Shields',
    'Loot Containers',
    'Traders',
    'Outfits',
    'Dynamic Events'
];

function loadWikiCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch {
        // ignore
    }

    return {
        lastUpdated: null,
        categories: {},
        allPages: []
    };
}

function saveWikiCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function isFresh(isoTimestamp, maxAgeMs) {
    if (!isoTimestamp) return false;
    const t = new Date(isoTimestamp).getTime();
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < maxAgeMs;
}

function hasAttachmentsPages(cache) {
    const pages = cache?.categories?.Attachments?.pages;
    return Array.isArray(pages) && pages.length > 0;
}

function hasWeaponAttachmentSlots(cache) {
    const weaponPages = cache?.categories?.Weapons?.pages;
    if (!Array.isArray(weaponPages) || !weaponPages.length) return false;
    return weaponPages.every(p => Array.isArray(p?.attachmentSlots) && Number.isFinite(p?.attachmentSlotCount));
}

function getAttachmentsIndexUrl() {
    return 'https://arc-raiders.fandom.com/wiki/Attachments#Weapon_Attachments';
}

async function apiGet(params) {
    const response = await axios.get(WIKI_API, {
        params: {
            format: 'json',
            ...params
        },
        timeout: 15000,
        headers: {
            'User-Agent': 'ArcRaidersBot/1.0 (Discord bot; wiki sync)'
        }
    });

    return response.data;
}

async function fetchCategoryMembers(categoryName) {
    const titles = [];
    let cmcontinue;

    while (true) {
        const data = await apiGet({
            action: 'query',
            list: 'categorymembers',
            cmtitle: `Category:${categoryName}`,
            cmlimit: 500,
            cmcontinue
        });

        const members = data?.query?.categorymembers || [];
        members.forEach(m => {
            if (m.ns === 0 && m.title) titles.push(m.title);
        });

        if (!data?.continue?.cmcontinue) break;
        cmcontinue = data.continue.cmcontinue;
    }

    return titles;
}

async function fetchAttachmentIndexTitles() {
    const data = await apiGet({
        action: 'parse',
        page: 'Attachments',
        prop: 'text'
    });

    const html = data?.parse?.text?.['*'] || '';
    if (!html) return [];

    const $ = cheerio.load(html);
    const titles = new Set();

    const table = $('table.fandom-table').first();
    if (!table.length) return [];

    table.find('tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 2) return;
        const title = $(cells[1]).text().replace(/\s+/g, ' ').trim();
        if (title) titles.add(title);
    });

    return Array.from(titles);
}

async function fetchWeaponAttachmentSlots(pageTitle) {
    if (!pageTitle) return [];

    const sectionsData = await apiGet({
        action: 'parse',
        page: pageTitle,
        prop: 'sections'
    });

    const sections = sectionsData?.parse?.sections || [];
    const attachmentsSection = sections.find(s => String(s?.line || '').trim().toLowerCase() === 'attachments');
    const sectionIndex = attachmentsSection?.index;
    if (!sectionIndex) return [];

    const htmlData = await apiGet({
        action: 'parse',
        page: pageTitle,
        section: sectionIndex,
        prop: 'text'
    });

    const html = htmlData?.parse?.text?.['*'] || '';
    if (!html) return [];

    const $ = cheerio.load(html);
    const slots = [];

    $('table.fandom-table tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (!cells.length) return;
        const slot = $(cells[0]).text().replace(/\s+/g, ' ').trim();
        if (slot) slots.push(slot);
    });

    return slots;
}

async function fetchPageDetails(titles) {
    if (!titles.length) return [];

    const results = [];
    const batchSize = 50;

    for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);

        const data = await apiGet({
            action: 'query',
            prop: 'extracts|pageimages|info',
            titles: batch.join('|'),
            redirects: 1,
            explaintext: 1,
            exintro: 1,
            exsentences: 2,
            inprop: 'url',
            piprop: 'original'
        });

        const pagesObj = data?.query?.pages || {};
        const pages = Object.values(pagesObj);

        pages.forEach(p => {
            if (!p || !p.title || p.missing) return;
            results.push({
                title: p.title,
                url: p.fullurl || null,
                summary: p.extract || '',
                image: p.original?.source || null
            });
        });
    }

    return results;
}

async function updateWikiCache({ force = false, maxAgeMs = 6 * 60 * 60 * 1000 } = {}) {
    const existing = loadWikiCache();
    const schemaOk = hasAttachmentsPages(existing) && hasWeaponAttachmentSlots(existing);
    if (!force && schemaOk && isFresh(existing.lastUpdated, maxAgeMs)) {
        return existing;
    }

    const categories = {};
    const allTitleSet = new Set();

    for (const category of DEFAULT_CATEGORIES) {
        try {
            const titles = category === 'Attachments'
                ? await fetchAttachmentIndexTitles()
                : await fetchCategoryMembers(category);
            categories[category] = { titles };
            titles.forEach(t => allTitleSet.add(t));
        } catch (e) {
            categories[category] = { titles: [], error: e?.message || 'Failed to fetch' };
        }
    }

    const allTitles = Array.from(allTitleSet);
    const details = await fetchPageDetails(allTitles);
    const byTitle = new Map(details.map(d => [d.title.toLowerCase(), d]));

    const normalizedCategories = {};
    for (const [category, info] of Object.entries(categories)) {
        const pages = category === 'Attachments'
            ? (info.titles || []).map(t => {
                const found = byTitle.get(t.toLowerCase());
                if (found) return found;
                return { title: t, url: getAttachmentsIndexUrl(), summary: '', image: null };
            })
            : (info.titles || [])
                .map(t => byTitle.get(t.toLowerCase()))
                .filter(Boolean);

        normalizedCategories[category] = {
            count: pages.length,
            pages
        };

        if (info.error) normalizedCategories[category].error = info.error;
    }

    const weaponPages = normalizedCategories?.Weapons?.pages || [];
    for (const weaponPage of weaponPages) {
        try {
            const slots = await fetchWeaponAttachmentSlots(weaponPage.title);
            if (Array.isArray(slots)) {
                weaponPage.attachmentSlots = slots;
                weaponPage.attachmentSlotCount = slots.length;
            }
        } catch {
            weaponPage.attachmentSlots = [];
            weaponPage.attachmentSlotCount = 0;
        }
    }

    const cache = {
        lastUpdated: new Date().toISOString(),
        categories: normalizedCategories,
        allPages: details
    };

    saveWikiCache(cache);
    return cache;
}

function getWikiLastUpdated() {
    const cache = loadWikiCache();
    return cache.lastUpdated;
}

module.exports = {
    updateWikiCache,
    getWikiLastUpdated,
    loadWikiCache,
    DEFAULT_CATEGORIES
};

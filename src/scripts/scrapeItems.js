const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://metaforge.app/arc-raiders/database/items/page/';
const OUTPUT_FILE = path.join(__dirname, '../data/allItems.json');

async function scrapeAllItems() {
    console.log('🔄 Starting ARC Raiders item scraper...');
    
    const allItems = {
        weapons: [],
        materials: [],
        consumables: [],
        equipment: [],
        crafting: [],
        other: [],
        lastUpdated: new Date().toISOString()
    };

    try {
        // Scrape multiple pages
        for (let page = 1; page <= 10; page++) {
            console.log(`📄 Scraping page ${page}...`);
            
            const response = await axios.get(`${BASE_URL}${page}`, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            let foundItems = 0;

            // Try different selectors for items
            $('[class*="item"], [class*="card"], .row, tr, li').each((i, el) => {
                const name = $(el).find('[class*="name"], h3, h4, .title, td:first-child').first().text().trim();
                const type = $(el).find('[class*="type"], [class*="category"], .badge, td:nth-child(2)').first().text().trim();
                const image = $(el).find('img').first().attr('src') || '';
                const link = $(el).find('a').first().attr('href') || '';
                
                if (name && name.length > 1 && name.length < 50) {
                    const item = {
                        name: name.toUpperCase(),
                        type: type || 'Unknown',
                        image: image.startsWith('http') ? image : `https://metaforge.app${image}`,
                        url: link.startsWith('http') ? link : `https://metaforge.app${link}`
                    };

                    // Categorize items
                    const typeLower = type.toLowerCase();
                    const nameLower = name.toLowerCase();
                    
                    if (typeLower.includes('weapon') || typeLower.includes('gun') || typeLower.includes('rifle') || 
                        typeLower.includes('smg') || typeLower.includes('shotgun') || typeLower.includes('pistol') ||
                        typeLower.includes('sniper') || typeLower.includes('lmg')) {
                        allItems.weapons.push(item);
                    } else if (typeLower.includes('material') || typeLower.includes('scrap') || typeLower.includes('component')) {
                        allItems.materials.push(item);
                    } else if (typeLower.includes('consumable') || typeLower.includes('med') || typeLower.includes('stim')) {
                        allItems.consumables.push(item);
                    } else if (typeLower.includes('equipment') || typeLower.includes('armor') || typeLower.includes('gear')) {
                        allItems.equipment.push(item);
                    } else if (typeLower.includes('craft') || typeLower.includes('blueprint')) {
                        allItems.crafting.push(item);
                    } else {
                        allItems.other.push(item);
                    }
                    foundItems++;
                }
            });

            console.log(`   Found ${foundItems} items on page ${page}`);
            
            if (foundItems === 0) {
                console.log('   No more items found, stopping...');
                break;
            }

            // Wait between requests
            await new Promise(r => setTimeout(r, 1000));
        }

        // Remove duplicates
        Object.keys(allItems).forEach(key => {
            if (Array.isArray(allItems[key])) {
                const seen = new Set();
                allItems[key] = allItems[key].filter(item => {
                    if (seen.has(item.name)) return false;
                    seen.add(item.name);
                    return true;
                });
            }
        });

        // Save to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allItems, null, 2));
        
        console.log('\n✅ Scraping complete!');
        console.log(`   Weapons: ${allItems.weapons.length}`);
        console.log(`   Materials: ${allItems.materials.length}`);
        console.log(`   Consumables: ${allItems.consumables.length}`);
        console.log(`   Equipment: ${allItems.equipment.length}`);
        console.log(`   Crafting: ${allItems.crafting.length}`);
        console.log(`   Other: ${allItems.other.length}`);
        console.log(`\n📁 Saved to: ${OUTPUT_FILE}`);

        return allItems;

    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        return allItems;
    }
}

// Run if called directly
if (require.main === module) {
    scrapeAllItems();
}

module.exports = { scrapeAllItems };

// 🌐 Level 1C Project: Static HTML Scraper with Custom Headers Using Axios + Cheerio
// This scraper extracts titles and descriptions from elements with `.cotent-item` class.
// It sends requests with custom HTTP headers to mimic a browser, ideal for bypassing
// basic bot protections. It supports pagination using `.pager .next a` and saves data as JSON.
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const siteUrl = "";

async function scraper(startUrl) {
    let url = startUrl;
    const scrapedContent = [];

    try {
        while (url) {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://google.com',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            });
            const $ = cheerio.load(data);

            // update this to match your target HTML
            $('.cotent-item').each((_, el) => {
                const title = $(el).find('h2').text().trim();
                const description = $(el).find('p').text().trim();

                scrapedContent.push({
                    title,
                    description
                })
            })

            // handle pagination
            const nextPage = $('.pager .next a').attr('href');
            if (nextPage) {
                url = siteUrl + nextPage;
            } else {
                url = null; // No more pages
            }
        };

        // save to file
        fs.writeFileSync('scrapped.json', JSON.stringify(scrapedContent, null, 2), 'utf-8');
        console.log('All content scraped successfully.');
    } catch (err) {
        console.log("Error occured:", err.message);
    }
}

scraper(siteUrl);

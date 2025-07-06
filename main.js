const puppeteer = require('puppeteer');
const fs = require('fs');

const siteUrl = "https://www.site.com/articles/";

async function scraper(startUrl) {
    let url = startUrl;
    const scrapedContent = [];

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        while (url) {
            await page.goto(url, { waitUntil: 'networkidle2' });

            // wait for content to load
            await page.waitForSelector('.article--post');

            // extract content
            const articles = await page.evaluate(() => {
                const items = [];
                document.querySelectorAll('.article--post').forEach(post => {
                    const title = post.querySelector('h2')?.innerText.trim();
                    const description = post.querySelector('p')?.innerText.trim();
                    if (title && description) {
                        items.push({ title, description });
                    }
                });
                return items;
            });

            scrapedContent.push(...articles);

            // check for pagination (adjust selector if needed)
            const nextPage = await page.evaluate(() => {
                const next = document.querySelector('.pagination__next a');
                return next ? next.href : null;
            });

            if (nextPage) {
                url = nextPage;
            } else {
                url = null;
            }
        }

        fs.writeFileSync('scrapped.json', JSON.stringify(scrapedContent, null, 2), 'utf-8');
        console.log('All content scraped successfully.');
    } catch (err) {
        console.log("Error occured:", err.message);
    } finally {
        await browser.close();
    }
}

scraper(siteUrl);

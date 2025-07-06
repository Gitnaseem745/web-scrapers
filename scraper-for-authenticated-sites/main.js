// 🔐 Level 3A Project: Scraping Authenticated Pages (Login Required)
// This scraper first logs into the site using credentials, then scrapes all
// quotes from paginated pages visible after login. Demonstrates login form
// submission, session handling, and dynamic page evaluation using Puppeteer.
const puppeteer = require('puppeteer');
const fs = require('fs');

const loginUrl = "https://quotes.toscrape.com/login";
const baseUrl = "https://quotes.toscrape.com";

async function scraper(startUrl) {
    let url = startUrl;
    let pageCount = 0;
    const maxPages = -1;
    const scrapedData = [];
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(loginUrl, { waitUntil: 'networkidle2' });
        await page.type('input[name="username"]', 'admin');
        await page.type('input[name="password"]', 'admin');
        await Promise.all([
            page.click('input[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        while (url) {
            if (maxPages !== 1 && pageCount === maxPages) break;

            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.quote');

            const quotes = await page.evaluate(() => {
                const all = [];
                
                document.querySelectorAll('.quote').forEach(quote => {
                    const text = quote.querySelector('.text')?.innerText.trim();
                    const author = quote.querySelector('.author')?.innerText.trim();
                    const tags = Array.from(quote.querySelectorAll('.tags .tag')).map(tag => tag.innerText);

                    all.push({
                        text,
                        author,
                        tags
                    });
                });

                return all;
            })

            scrapedData.push(...quotes);

            const nextPage = await page.evaluate(() => {
                const link = document.querySelector('.next a');
                return link ? link.href : null;
            });

            url = nextPage;
            pageCount++;
        }
        
        fs.writeFileSync('authenticated-quotes.json', JSON.stringify(scrapedData, null, 2), 'utf-8');
        console.log("Scraping successful.");
    } catch (error) {
        console.log("Error occured: ", error.message);
    } finally {
        await browser.close();
    }
}

scraper(baseUrl);

// this one is a actual heavy scraper to scrap all authors details from [site]
const puppeteer = require('puppeteer');
const fs = require('fs');

const baseUrl = "https://quotes.toscrape.com";

async function scraper(startUrl) {
    let url = startUrl;
    const quotesData = [];

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        while (url) {
            await page.goto(url, { waitUntil: 'networkidle2' });

            await page.waitForSelector('.quote');

            const quotesContent = await page.evaluate(() => {
                const scrapedContent = [];

                document.querySelectorAll('.quote').forEach(quote => {
                    const text = quote.querySelector('.text')?.innerText.trim();
                    const author = quote.querySelector('.author')?.innerText.trim();
                    const author_page = quote.querySelector('span a')?.href;

                    scrapedContent.push({
                        text,
                        author,
                        author_page
                    });
                });

                return scrapedContent;
            });

            for (const quote of quotesContent) {
                const authorUrl = quote.author_page;
                const authorPage = await browser.newPage();

                await authorPage.goto(authorUrl, { waitUntil: 'networkidle2' });

                await authorPage.waitForSelector('.author-details');

                const authorDetails = await authorPage.evaluate(() => {
                    const bornDate = document.querySelector('.author-born-date').innerText.trim();
                    const description = document.querySelector('.author-description').innerText.trim();
                    return { bornDate, description };
                });

                quote.bornDate = authorDetails.bornDate;
                quote.description = authorDetails.description;
                await authorPage.close();
            }

            // pagination
            const nextPage = await page.evaluate(() => {
                const href = document.querySelector('.pager .next a')?.href;
                return href ? href : null;
            });

            url = nextPage;

            quotesData.push(...quotesContent);
        }

        fs.writeFileSync('nested-scraped.json', JSON.stringify(quotesData, null, 2), 'utf-8');
        console.log("Scraping Successful.");
    } catch (error) {
        console.log("Error occured: ", error.message);
    } finally {
        await browser.close();
    }
}

scraper(baseUrl);

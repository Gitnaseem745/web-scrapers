// this scraper scrapes all the articles from smashing magazine site using puppeteer it also has limit to pagination
const puppeteer = require('puppeteer');
const fs = require('fs');

const siteUrl = "https://www.smashingmagazine.com/articles/";

async function scraper(startUrl) {
    let url = startUrl;
    let pageCount = 0;
    const maxPages = 2; // max number of pages to scrape
    const scrapedContent = [];

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        while (url) {
            // page limit check
            if (pageCount === maxPages) break;

            await page.goto(url, { waitUntil: 'networkidle2' });

            await page.waitForSelector('.article--post');

            // extract meta-content
            const articles = await page.evaluate(() => {
                const items = [];
                document.querySelectorAll('.article--post').forEach(post => {
                    const title = post.querySelector('h2')?.innerText.trim();
                    const description = post.querySelector('p')?.innerText.trim();
                    const link = post.querySelector('.read-more-link')?.href;

                    items.push({
                        title,
                        description,
                        link
                    });
                });
                return items;
            });

            // scraping each article content for all current page articles
            for (const article of articles) {
                try {
                    const articleUrl = article.link;
                    const articlePage = await browser.newPage();

                    await articlePage.goto(articleUrl, { waitUntil: 'networkidle2' });

                    await articlePage.waitForSelector('.article__content');

                    const content = await articlePage.evaluate(() => {
                        return document.querySelector('.article__content').innerHTML;
                    });

                    article.content = content;
                    article.scrapedAt = new Date().toISOString();
                    await articlePage.close();
                } catch (error) {
                    console.log(`Failed to scrape aritcle: ${article.link}\nReason: ${error.message}`);
                }
            }

            // storing current page articles
            scrapedContent.push(...articles);

            // check for pagination
            const nextPage = await page.evaluate(() => {
                const next = document.querySelector('.pagination__next a');
                return next ? next.href : null;
            });

            url = nextPage;
            pageCount++;
        }

        // creating and storing inside scrapped.json 
        fs.writeFileSync('scrapped.json', JSON.stringify(scrapedContent, null, 2), 'utf-8');
        console.log('All content scraped successfully.');
    } catch (err) {
        console.log("Error occured:", err.message);
    } finally {
        await browser.close();
    }
}

scraper(siteUrl);

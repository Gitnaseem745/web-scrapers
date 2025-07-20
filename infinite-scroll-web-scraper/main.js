// 📦 Level 3B+ Project: Infinite Scroll Web Scraper with Nested Author Profile Scraping
// This scraper navigates to an infinite scroll page (quotes.toscrape.com/scroll),
// scrolls until all content is loaded, scrapes all quotes, and then visits each
// author's profile page to fetch detailed bio data like birth date and description.
// The final dataset is saved as JSON. Built using Puppeteer.
const puppeteer = require('puppeteer');
const fs = require('fs');

const site_url = "https://quotes.toscrape.com/scroll";

async function scraper(url) {
    const scraped_quotes = [];
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // scroll and load all quotes
        let prev_height;
        let scroll_count = 0;

        while (true) {
            scroll_count++;
            prev_height = await page.evaluate('document.body.scrollHeight');

            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await new Promise(resolve => setTimeout(resolve, 1500)); // wait to load content

            const new_height = await page.evaluate('document.body.scrollHeight');
            if (new_height === prev_height) break;
        }

        console.log(`Finished scrolling after ${scroll_count} steps.`);

        // scrape quotes
        const quotes = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.quote'), q => {
                const text = q.querySelector('.text')?.innerText.trim();
                const name = q.querySelector('.author')?.innerText.trim();
                const profile_link = q.querySelector('span a')?.href;
                const tags = Array.from(q.querySelectorAll('.tags .tag')).map(t => t.innerText);
                return { text, author: { name, profile_link }, tags };
            });
        });

        console.log(`Finished scraping all ${quotes.length} quotes.`);

        // scraping full author details
        for (const quote of quotes) {
            const author_page_url = quote.author.profile_link;
            if (!author_page_url) continue; // if no author_page goto next iteration

            const author_page = await browser.newPage();
            await author_page.goto(author_page_url, { waitUntil: 'networkidle2' });
            await author_page.waitForSelector('.author-details');

            const author_details = await author_page.evaluate(() => {
                const born_date = document.querySelector('.author-born-date').innerText.trim();
                const description = document.querySelector('.author-description').innerText.trim();
                return { born_date, description };
            });

            quote.author.born_date = author_details.born_date;
            quote.author.description = author_details.description;
            await author_page.close();
        }

        console.log(`Finished scraping all authors details.`);
        scraped_quotes.push(...quotes);

        // save quotes
        fs.writeFileSync('scraped_quotes.json', JSON.stringify(scraped_quotes, null, 2), 'utf-8');
        console.log(`Scraped ${quotes.length} quotes and saved to scraped_quotes.json`);
    } catch (e) {
        console.log("Error occured: ", e.message);
    } finally {
        await browser.close();
    }
}

scraper(site_url);

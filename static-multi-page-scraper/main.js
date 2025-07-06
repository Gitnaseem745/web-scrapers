// 🧪 Level 2A Project: Static Multi-Page Scraper Using Axios + Cheerio
// A beginner-friendly scraper using Axios and Cheerio to fetch paginated
// quote data (text, author, tags) from quotes.toscrape.com. 
// Demonstrates looping through pagination and saving structured data as JSON.
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const baseUrl = "https://quotes.toscrape.com/";

async function scraperAll(startUrl) {
    // site to scrap from
    let url = startUrl;
    const scrapedContent = [];

    try {
        while (url) {
        // scarpping html then loading it in $
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // looping -> finding -> storing 
        $('.quote').each((i, el) => {
            const text = $(el).find('.text').text().trim();
            const author = $(el).find('.author').text().trim();
            const tags = [];

            // finding -> looping -> storing all the a tags with tag class 
            $(el).find('.tags a.tag').each((i, tagEl) => {
                tags.push($(tagEl).text());
            });

            scrapedContent.push({
                text,
                author,
                tags
            });
        });

        // find nextpage link if it exists
        // note: use it outside any other el function. ex: .quote > pager won't find pager is outside
        const nextPage = $('.pager .next a').attr('href');
        if (nextPage) {
            url = baseUrl + nextPage;
        } else {
            url = null;
        }
    }
        // storing quotes to the quotes.json
        fs.writeFileSync('scraped.json', JSON.stringify(scrapedContent, null, 2), 'utf-8');
        console.log("Scrapping Succesful.");
    } catch (err) {
        console.log("Error:", err.message);
    }
}

scraperAll(baseUrl);

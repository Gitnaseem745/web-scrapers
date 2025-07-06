// 📦 Level 3C++ Project: Keyword-Based Infinite Scroll Image Scraper for Unsplash
// This scraper accepts a keyword via CLI, searches Unsplash, clicks "Load More" if present,
// and performs infinite scrolling to fetch dynamically loaded images.
//
// It intelligently extracts only high-resolution `.jpg` and `.png` images while avoiding
// profile avatars, placeholders, and low-quality crops.
//
// All images are saved in a structured folder under `images/<keyword>/`.
//
// Technologies used: Puppeteer (headless browser), Axios (streaming downloads), Node.js fs & path.
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// user given query
const searchQuery = process.argv[2];
if (!searchQuery) {
    console.log("Please provide a search keyword. Example: node main.js cats");
    process.exit(1);
}

const targetUrl = `https://unsplash.com/s/photos/${searchQuery}`;

// keyword to slug
const slugify = (str) => str.toLowerCase().replace('/[^a-z0-9]/gi', '-');

// download image using axios and fs
async function downloadImage(imageUrl, filePath) {
    const fileStream = fs.createWriteStream(filePath);
    const response = await axios.get(imageUrl, {
        responseType: 'stream'
    });

    response.data.pipe(fileStream);

    return new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
    });
}

async function scrapeImagesFromPage(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const keyword = searchQuery;
    console.log("Searching on:", url)

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Scroll once to reveal the "Load more" button
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(res => setTimeout(res, 2000));

        // Try clicking the "Load more" button if it exists
        const loadMoreClicked = await page.evaluate(() => {
            const loadMoreBtn = Array.from(document.querySelectorAll('button'))
                .find(btn => btn.textContent.trim().toLowerCase().includes('load more'));
            if (loadMoreBtn) {
                loadMoreBtn.click();
                return true;
            }
            return false;
        });

        console.log("Load more clicked:", loadMoreClicked);
        await new Promise(res => setTimeout(res, 2000)); // wait for images to load

        // Scroll to load images dynamically
        let previousScrollHeight;
        let scrollAttempts = 0;
        const maxScrollAttempts = 1;

        while (true) {
            scrollAttempts++;
            previousScrollHeight = await page.evaluate(() => document.body.scrollHeight);

            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const currentScrollHeight = await page.evaluate(() => document.body.scrollHeight);
            if (currentScrollHeight === previousScrollHeight || scrollAttempts === maxScrollAttempts) break;
        }

        console.log("Finished scrolling. Extracting image URLs...");

        // Extract image URLs from page
        const imageUrls = await page.evaluate(() => {
            const urls = new Set();
            document.querySelectorAll('img').forEach(img => {
                const srcSet = img.getAttribute('srcset');
                let src = srcSet?.split(',')?.pop()?.split(' ')?.[0] || img.src;

                if (
                    src && src.includes('images.unsplash.com') &&          
                    (src.includes('fm=jpg') || src.includes('fm=jpeg') || src.includes('fm=png')) &&
                    !src.includes('profile-') && !src.includes('crop')                             
                ) {
                    urls.add(src);
                }
            });
            return Array.from(urls);
        });

        console.log(`Found ${imageUrls.length} unique ${keyword} images.`);

        // Ensure the 'images' folder exists
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

        // Ensure the 'keyword' folder exists
        const keywordDir = path.join(__dirname, 'images', keyword);
        if (!fs.existsSync(keywordDir)) fs.mkdirSync(keywordDir);

        console.log(`Downloading all available images for ${keyword}.`);

        // Download each image
        for (let i = 0; i < imageUrls.length; i++) {
            const imageName = `${slugify(keyword)}-img-${i + 1}.jpg`;
            const imageUrl = imageUrls[i];
            const imageFilePath = path.join(keywordDir, imageName);

            try {
                await downloadImage(imageUrl, imageFilePath);
                console.log(`Downloaded: ${imageName}`);

                await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                console.error(`Failed to download ${imageName}:`, error.message);
            }
        }

        console.log(`All images downloaded successfully inside ${keywordDir.split('images')} folder.`);
    } catch (error) {
        console.error("Scraper Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeImagesFromPage(targetUrl);

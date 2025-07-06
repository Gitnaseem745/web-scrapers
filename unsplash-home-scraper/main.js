// 🔍 Level 3C — Infinite Scroll Scraping for Unsplash
// Handles infinite scrolling
// Extracts image URLs using srcset (preferring higher quality versions)
// Filters URLs to only include images hosted on images.unsplash.com
// Downloads images using Axios streams
// Organizes images with consistent naming sitename-1.jpg, sitename-2.jpg,
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const targetUrl = "https://unsplash.com/";

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

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

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
                const src = img.getAttribute('srcset')?.split(',')?.pop()?.split(' ')?.[0] || img.src;
                if (src && src.includes('images.unsplash.com')) {
                    urls.add(src);
                }
            });
            return Array.from(urls);
        });

        console.log(`Found ${imageUrls.length} unique images.`);

        // Ensure the 'images' folder exists
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

        // Download each image
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            const imageFilePath = path.join(imagesDir, `unsplash-${i + 1}.jpg`);

            try {
                await downloadImage(imageUrl, imageFilePath);
                console.log(`Downloaded: unsplash-image-${i + 1}.jpg`);

                await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                console.error(`Failed to download image ${i + 1}:`, error.message);
            }
        }

        console.log("All images downloaded successfully.");
    } catch (error) {
        console.error("Scraper Error:", error.message);
    } finally {
        await browser.close();
    }
}

scrapeImagesFromPage(targetUrl);

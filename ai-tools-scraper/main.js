const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const site_url = "";

// Function to load proxies from file
function loadProxies() {
    const proxiesFile = path.join(__dirname, 'proxies.txt');
    let proxyList = [null]; // Start with no proxy as default

    try {
        if (fs.existsSync(proxiesFile)) {
            const content = fs.readFileSync(proxiesFile, 'utf-8');
            const proxies = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#')) // Remove comments and empty lines
                .filter(Boolean);

            if (proxies.length > 0) {
                proxyList = proxyList.concat(proxies);
                console.log(`Loaded ${proxies.length} proxies from file`);
            }
        }
    } catch (error) {
        console.log('Could not load proxies file:', error.message);
    }

    return proxyList;
}

// Load proxy list
const proxyList = loadProxies();

// User agents for rotation
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

// Function to get random element from array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Function to remove duplicates from tools array
function removeDuplicates(tools) {
    const seen = new Set();
    const uniqueTools = [];

    for (const tool of tools) {
        // Create a unique identifier using name and URL
        const identifier = `${tool.meta.name}|${tool.meta.pageUrl}`;

        if (!seen.has(identifier)) {
            seen.add(identifier);
            uniqueTools.push(tool);
        } else {
            console.log(`Duplicate found and removed: ${tool.meta.name}`);
        }
    }

    return uniqueTools;
}

async function scraper(url) {
    let tools = [];
    let browser = null;

    try {
        // Random proxy selection
        const selectedProxy = getRandomElement(proxyList);

        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--no-first-run',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--ignore-certificate-errors-spki-list'
            ]
        };

        // Add proxy if available
        if (selectedProxy) {
            launchOptions.args.push(`--proxy-server=${selectedProxy}`);
            console.log(`Using proxy: ${selectedProxy}`);
        } else {
            console.log('Using direct connection (no proxy)');
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Random user agent
        const userAgent = getRandomElement(userAgents);
        await page.setUserAgent(userAgent);
        console.log(`Using User Agent: ${userAgent.substring(0, 50)}...`);

        // Additional stealth measures
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Remove automation indicators
            delete navigator.__proto__.webdriver;

            // Mock languages and plugins
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });

            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        });

        // Set viewport
        // await page.setViewport({ width: 1920, height: 1080 });

        console.log(`Navigating to: ${url}`);
        await page.goto(url, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: 60000
        });

        // Wait for initial content to load
        await page.waitForSelector('.group.relative.overflow-hidden', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Scroll to load more content with proper delays
        let prevHeight = 0;
        let scrollCount = 0;
        const maxScrolls = 1;

        while (scrollCount < maxScrolls) {
            scrollCount++;

            // Get current height
            prevHeight = await page.evaluate('document.body.scrollHeight');

            // Scroll down
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check if new content loaded
            const newHeight = await page.evaluate('document.body.scrollHeight');
            console.log(`Scroll ${scrollCount}: Height changed from ${prevHeight} to ${newHeight}`);

            if (newHeight === prevHeight) {
                console.log('No new content loaded, stopping scroll');
                break;
            }
        }

        console.log(`Finished scrolling after ${scrollCount} steps.`);

        // Wait a bit more for all content to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract data with better error handling
        try {
            // Check if page is still valid
            const isPageValid = await page.evaluate(() => {
                return document.readyState === 'complete';
            });

            if (!isPageValid) {
                throw new Error('Page is not in a valid state');
            }

            tools = await page.evaluate(() => {
                const elements = document.querySelectorAll('.group.relative.overflow-hidden');
                console.log(`Found ${elements.length} tool elements`);

                return Array.from(elements, (t, index) => {
                    try {
                        const pageUrl = t.querySelector('a')?.href || "no-url";
                        const name = t.querySelector('h3')?.innerText?.trim() || "no-name";
                        const description = t.querySelector('p')?.innerText?.trim() || "no-description";
                        const tag = t.querySelector('[class*="from-purple-600"][class*="to-blue-600"]')?.innerText?.trim() || "no-tag";
                        const visitUrl = t.querySelector('[class*="bg-gradient-to-r"][href]')?.href || null;
                        const thumbnail = t.querySelector('img')?.src || null;

                        return {
                            index: index + 1,
                            meta: { name, description, tag, thumbnail, pageUrl, visitUrl }
                        };
                    } catch (err) {
                        console.log(`Error processing element ${index}:`, err.message);
                        return null;
                    }
                }).filter(Boolean); // Remove null entries
            });

            console.log(`Successfully extracted ${tools.length} tools`);

        } catch (err) {
            console.log("DOM access error:", err.message);

            // Try to reload the page and extract again
            console.log("Attempting to reload page and retry...");
            await page.reload({ waitUntil: ['domcontentloaded', 'networkidle2'] });
            await page.waitForSelector('.group.relative.overflow-hidden', { timeout: 30000 });

            tools = await page.evaluate(() => {
                const elements = document.querySelectorAll('.group.relative.overflow-hidden');
                return Array.from(elements, (t, index) => {
                    const pageUrl = t.querySelector('a')?.href || "no-url";
                    const name = t.querySelector('h3')?.innerText?.trim() || "no-name";
                    const description = t.querySelector('p')?.innerText?.trim() || "no-description";
                    const tag = t.querySelector('[class*="from-purple-600"][class*="to-blue-600"]')?.innerText?.trim() || "no-tag";
                    const visitUrl = t.querySelector('[class*="bg-gradient-to-r"][href]')?.href || null;
                    const thumbnail = t.querySelector('img')?.src || null;

                    return {
                        index: index + 1,
                        meta: { name, description, tag, thumbnail, pageUrl, visitUrl }
                    };
                });
            });
        }

        // Remove duplicates before processing
        tools = removeDuplicates(tools);
        console.log(`After removing duplicates: ${tools.length} unique tools`);

        // Process each tool individually with proper error handling
        console.log(`Starting detailed scraping for ${tools.length} tools...`);

        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            const tool_page_url = tool.meta.pageUrl;

            if (!tool_page_url || tool_page_url === "no-url") {
                console.log(`Skipping tool ${i + 1}: No valid URL`);
                continue;
            }

            console.log(`Processing tool ${i + 1}/${tools.length}: ${tool.meta.name}`);

            let tool_page = null;
            try {
                // Create new page for each tool with random user agent
                tool_page = await browser.newPage();

                // Random user agent for each request
                const randomUserAgent = getRandomElement(userAgents);
                await tool_page.setUserAgent(randomUserAgent);

                // Random delay between requests (1-3 seconds)
                const delay = 1000 + Math.random() * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));

                // Add stealth measures for each page
                await tool_page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                    });
                    delete navigator.__proto__.webdriver;
                });

                // Navigate to tool page with timeout
                await tool_page.goto(tool_page_url, {
                    waitUntil: ['domcontentloaded', 'networkidle2'],
                    timeout: 30000
                });

                // Wait for the main content selector
                try {
                    await tool_page.waitForSelector('h1', { timeout: 10000 });
                } catch (selectorError) {
                    console.log(`Selector not found for tool ${i + 1}, trying alternative approach`);
                    // Continue anyway, maybe the page structure is different
                }

                // Scroll to load any lazy content
                await tool_page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });

                // Wait for content to load
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Extract tool details with error handling
                const tool_details = await tool_page.evaluate(() => {
                    try {
                        const title = document.querySelector('h1')?.innerText?.trim() || "no-title";
                        const subheading = document.querySelector('h2')?.innerText?.trim() || "no-subheading";
                        const description = document.querySelector('div.mb-8 > p.text-gray-300')?.innerText?.trim() || "no-description";
                        const location = document.querySelector('[class*="from-orange-600"][class*="to-red-600"] > p')?.innerText?.trim() || "no-location";

                        const techStackElements = document.querySelectorAll('div.flex.flex-wrap.gap-1.mt-1 > span');
                        const techStack = Array.from(techStackElements).map(s => s.innerText?.trim()).filter(Boolean);

                        const tagsElement = document.querySelector('a.inline-flex.items-center.bg-gradient-to-r');
                        const tags = tagsElement?.innerText?.trim()?.split(' ') || [];

                        // Find features container using a more flexible approach
                        let features = [];
                        try {
                            // Try different selectors for features
                            let featuresContainer = document.querySelector('.grid.gap-8') ||
                                document.querySelector('[class*="grid"][class*="gap-8"]') ||
                                document.querySelector('.grid') ||
                                document.querySelector('[class*="features"]');

                            if (featuresContainer) {
                                const featureElements = featuresContainer.querySelectorAll('div');
                                const featuresArray = Array.from(featureElements).map(f => {
                                    const name = f.querySelector('h4')?.innerText?.trim() || f.querySelector('h3')?.innerText?.trim() || "";
                                    const details = f.querySelector('p')?.innerText?.trim() || "";
                                    return name || details ? { name, details } : null;
                                }).filter(Boolean);

                                // Remove duplicates based on name and details
                                const seen = new Set();
                                features = featuresArray.filter(feature => {
                                    const identifier = `${feature.name}|${feature.details}`;
                                    if (!seen.has(identifier)) {
                                        seen.add(identifier);
                                        return true;
                                    }
                                    return false;
                                });
                            }
                        } catch (featuresError) {
                            console.log('Error extracting features:', featuresError.message);
                            features = [];
                        }

                        let finalThoughts = "no-final-thoughts";
                        try {
                            // Try different selectors for final thoughts
                            const finalThoughtsElement = document.querySelector('[class*="from-gray-800"]') ||
                                document.querySelector('[class*="final"]') ||
                                document.querySelector('.relative.z-10 p') ||
                                document.querySelector('[class*="conclusion"]');
                            finalThoughts = finalThoughtsElement?.innerText?.trim() || "no-final-thoughts";
                        } catch (finalError) {
                            console.log('Error extracting final thoughts:', finalError.message);
                        }

                        return { title, subheading, description, location, tags, techStack, features, finalThoughts };
                    } catch (evalError) {
                        console.log('Error in page evaluation:', evalError.message);
                        return { error: evalError.message };
                    }
                });

                // Add the details to the tool
                tool.main = tool_details;
                console.log(`✓ Successfully processed tool ${i + 1}: ${tool.meta.name}`);

            } catch (pageError) {
                console.log(`✗ Error processing tool ${i + 1} (${tool.meta.name}): ${pageError.message}`);
                tool.main = { error: pageError.message, timestamp: new Date().toISOString() };
            } finally {
                // Always close the page to free up resources
                if (tool_page) {
                    try {
                        await tool_page.close();
                    } catch (closeError) {
                        console.log(`Warning: Could not close page for tool ${i + 1}: ${closeError.message}`);
                    }
                }
            }

            // Add a random delay between requests to be respectful (2-5 seconds)
            if (i < tools.length - 1) {
                const randomDelay = 2000 + Math.random() * 3000;
                console.log(`Waiting ${Math.round(randomDelay / 1000)}s before next request...`);
                await new Promise(resolve => setTimeout(resolve, randomDelay));
            }
        }

        // Final duplicate check and cleanup
        tools = removeDuplicates(tools);
        console.log(`Final count after duplicate removal: ${tools.length} unique tools`);

        // Save to file
        const outputFile = 'ai-tools-data.json';
        fs.writeFileSync(outputFile, JSON.stringify(tools, null, 2), 'utf-8');
        console.log(`Scraped ${tools.length} unique tools and saved to ${outputFile}`);

    } catch (e) {
        console.log("Error occurred: ", e.message);
        console.log("Stack trace: ", e.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

scraper(site_url);

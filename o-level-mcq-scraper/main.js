// 🎓 Level 3C+++ Advanced Scraper – O-Level MCQs Extractor : Final Scraper of the Learning
//
// This powerful scraper was built to extract thousands of MCQs (~6000+) across
// all chapters and papers from a specific O-Level exam preparation site.
// Designed for deep academic scraping, it's particularly useful for students
// preparing for standardized tests by collecting large datasets for revision.
//
// 🔍 How It Works:
// 1. Navigates to the main paper page (e.g., "Introduction to Computers").
// 2. Extracts all chapter titles and their URLs pointing to the MCQ pages.
// 3. For each chapter, it visits the respective page and handles pagination:
//    - Collects MCQs from page 1, 2, 3… until no more pages remain.
//    - Each MCQ includes question number, English & Hindi text, options, and the correct answer.
// 4. Once all chapters are scraped, the results are structured and saved into
//    a JSON file named like: `mcqs.json`.
//
// 🔁 To scrape other papers, simply update the URL at the top of the script,
// and the scraper will repeat the entire process.
//
// 📦 Output Format:
// A chapter-wise JSON structure, ready for analysis, quizzes, or flashcards.
//
// 💡 Use Case:
// This project demonstrates how advanced scraping can help collect meaningful
// educational data when done ethically. It’s a perfect blend of pagination logic,
// nested data extraction, dynamic waits, and intelligent error handling.
//
// ✅ Built using: Puppeteer, JavaScript (Node.js), fs module

const puppeteer = require('puppeteer');
const fs = require('fs');

const siteUrl = "";

async function scrapeMCQs(url) {
    const chapterWiseMCQ = [];

    const browser = await puppeteer.launch({ headless: true });
    const chaptersPage = await browser.newPage();

    try {
        await chaptersPage.goto(url, { waitUntil: 'networkidle2' });
        await chaptersPage.waitForSelector('.box_list');

        console.log("All wrapers are loaded, starting links scraping...");

        const chapters = await chaptersPage.evaluate(() => {
            const hrefs = [];
            document.querySelectorAll('.wrapper').forEach(c => {
                const name = c.querySelector('h6 a')?.innerText.trim();
                const href = c.querySelector('h6 a')?.href;
                if (href && href.startsWith('https://olevelexam.com/mcq-')) {
                    hrefs.push({ name, href });
                }
            });
            return hrefs.filter(h => h !== null || h.name !== "");
        });

        console.log("All chapters links are scraped...");
        console.log("Urls", chapters);

        for (const chapter of chapters) {
            let chapterUrl = chapter.href;
            const currentChapterMCQs = [];
            let pageCount = 1;

            const mcqsPage = await browser.newPage();

            console.log(`Scraping mcqs for ${chapter.name} page...`);

            while (chapterUrl) {
                console.log(`Scraping ${chapter.name}'s chapter mcqs page no ${pageCount}...`);

                await new Promise(res => setTimeout(res, 2000 + Math.random() * 2000));

                await mcqsPage.goto(chapterUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
                await mcqsPage.waitForSelector('form', { timeout: 10000 });

                await mcqsPage.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                })

                const currentPageMCQs = await mcqsPage.evaluate(() => {
                    const mcqs = [];
                    document.querySelectorAll('fieldset').forEach(m => {
                        const questionNumber = m.querySelector('.card-title')?.innerText.replace('\n Bookmark  Report Bug', '').trim();
                        const questionEnglish = m.querySelector('.english')?.innerText.trim();
                        const questionHindi = m.querySelector('.hindi')?.innerText.trim();
                        const answers = Array.from(m.querySelectorAll('.mcq-answer')).map(a => a.innerText.trim());
                        const correctAnswer = m.querySelector('.correct').innerText.trim();

                        if (questionNumber && questionEnglish && questionHindi && answers && correctAnswer) {
                            mcqs.push({
                                question_num: questionNumber,
                                question_eng: questionEnglish,
                                question_hi: questionHindi,
                                answers: answers,
                                correct_answer: correctAnswer
                            });
                        }
                    });
                    return mcqs;
                });

                currentChapterMCQs.push(...currentPageMCQs);

                console.log(`Scraped ${chapter.name}'s chapter mcqs page no ${pageCount}...`);

                pageCount++;

                const nextPageHref = await mcqsPage.evaluate(() => {
                    const activeItem = document.querySelector('.pagination .page-item.active');
                    if (!activeItem) return null;

                    const currentPageNum = parseInt(activeItem?.innerText?.trim());
                    if (isNaN(currentPageNum)) return null;

                    // Get all valid page number links
                    const pageLinks = Array.from(document.querySelectorAll('.pagination .page-item a'))
                        .filter(el => !isNaN(parseInt(el.innerText.trim())));

                    const lastPageNum = pageLinks.length > 0
                        ? Math.max(...pageLinks.map(el => parseInt(el.innerText.trim())))
                        : null;

                    if (!lastPageNum || currentPageNum >= lastPageNum) return null;

                    const activeIndex = pageLinks.findIndex(el => parseInt(el.innerText.trim()) === currentPageNum);
                    const nextLink = pageLinks[activeIndex + 1];

                    return nextLink ? nextLink.getAttribute('href') : null;
                });


                if (pageCount > 20) break; // we don't scrape more than 20 pages cause those are enough mcqs
                if (nextPageHref && nextPageHref.startsWith('http')) {
                    chapterUrl = nextPageHref;
                } else if (nextPageHref) {
                    const base = new URL(chapterUrl).origin;
                    chapterUrl = base + nextPageHref;
                } else {
                    console.log(`No more pages found for ${chapter.name}, moving to next chapter...`);
                    break;
                }


            }
            console.log(`Scraped mcqs for ${chapter.name} page...`);

            chapterWiseMCQ.push({
                chapter: chapter.name,
                chapter_mcqs: currentChapterMCQs
            });
            await mcqsPage.close();
        }

        fs.writeFileSync('mcqs.json', JSON.stringify(chapterWiseMCQ, null, 2), 'utf-8');
        console.log('All MCQs are scraped and stored successfully.');
    } catch (err) {
        console.log("Error occured:", err.message);
    } finally {
        await browser.close();
    }
}

scrapeMCQs(siteUrl);

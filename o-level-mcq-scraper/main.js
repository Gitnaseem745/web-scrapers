const puppeteer = require('puppeteer');
const fs = require('fs');

const siteUrl = "https://olevelexam.com/information-technology-tools-and-network-basics";

async function scrapeMCQs(url) {
    const chapterWiseMCQ = [];

    const browser = await puppeteer.launch({ headless: true });
    const chaptersPage = await browser.newPage();

    try {
        await chaptersPage.goto(url, { waitUntil: 'networkidle2' });

        await chaptersPage.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await chaptersPage.waitForSelector('.wrapper');

        console.log("All wrapers are loaded, starting links scraping...");

        const chapters = await chaptersPage.evaluate(() => {
            const hrefs = [];
            document.querySelectorAll('.wrapper').forEach(c => {
                const name = c.querySelector('h6 a').innerText.trim();
                const href = c.querySelector('h6 a').href;
                if (name && href && href.startsWith('https://olevelexam.com/mcq-')) {
                    hrefs.push({ name, href });
                }
            });
            return hrefs;
        });

        console.log("All chapters links are scraped...");
        
        for (const chapter of chapters) {
            if (!chapter.name || !chapter.href) continue;

            let chapterUrl = chapter.href;
            const currentChapterMCQs = [];

            const mcqsPage = await browser.newPage();

            console.log(`Scraping mcqs for ${chapter.name} page...`);
            
            while (chapterUrl) {
                await mcqsPage.goto(chapterUrl, { waitUntil: 'networkidle2' });
                await mcqsPage.waitForSelector('form');

                await mcqsPage.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                })
                
                const currentPageMCQs = await mcqsPage.evaluate(() => {
                    const mcqs = [];
                    document.querySelectorAll('fieldset').forEach( m => {
                        const questionNumber = m.querySelector('.card-title')?.innerText.replace('\n Bookmark  Report Bug').trim();
                        const questionEnglish = m.querySelector('.english')?.innerText.trim();
                        const questionHindi = m.querySelector('.hindi')?.innerText.trim();
                        const answers = Array.from(m.querySelectorAll('.mcq-answer')).map(a => a.innerText.trim());
                        const correctAnswer = m.querySelector('.correct').innerText.trim();

                        if (questionNumber && questionEnglish && questionHindi && answers && correctAnswer ) {
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
                
                const nextPage = await mcqsPage.evaluate(() => {
                    const nextLink = Array.from(
                        document.querySelectorAll('.pagination .page-item'))
                        .find(a => a.innerText.trim().toLowerCase() === 'next');
                    return nextLink ? nextLink.href : null;
                });
                
                if (nextPage) {
                    chapterUrl = nextPage;
                } else {
                    chapterUrl = null;
                }
            }
            
            console.log(`Scraped mcqs for ${chapter.name} page...`);
            
            chapterWiseMCQ.push({
                chapter: chapter.name,
                chapter_mcqs: currentChapterMCQs
            });
            await mcqsPage.close();
        }

        fs.writeFileSync('chapter-wise-o-level-mcqs.json', JSON.stringify(chapterWiseMCQ, null, 2), 'utf-8');
        console.log('All MCQs are scraped and stored successfully.');
    } catch (err) {
        console.log("Error occured:", err.message);
    } finally {
        await browser.close();
    }
}

scrapeMCQs(siteUrl);

# 📚 Web Scraping Guide – Techniques & Patterns

This guide documents all the scraping concepts, strategies, and best practices I’ve used across the projects in this repository. It’s meant to be a personal cheat sheet and learning reference.

> 🧠 Learning path: From static HTML scraping to advanced infinite scroll & login-based scrapers.

---

## 📦 Tools Used

| Tool         | Purpose                                     |
|--------------|---------------------------------------------|
| **Axios**    | Making HTTP requests to static pages        |
| **Cheerio**  | jQuery-like parsing of HTML using selectors |
| **Puppeteer**| Headless browser automation for dynamic content |
| **fs**       | To write scraped data to `.json` files and images |

---

## 🧰 Core Techniques & Concepts

### 1. ✅ Static Scraping with Axios + Cheerio
Used in: `axios-scraper-template/`, `static-multi-page-scraper/`

```js
const { data } = await axios.get(url);
const $ = cheerio.load(data);
const title = $('h1').text();
````

#### 💡 Tips:

* Use `.text()` to extract inner text
* Use `.attr()` to extract HTML attributes like `href` or `src`
* Loop with `.each()` for elements

---

### 2. 🔁 Multi-Page Scraping (Pagination)

Used in: `static-multi-page-scraper/`, `multi-page-web-scraper/`, `articles-meta-scraper/`

```js
const nextPage = $('.pager .next a').attr('href');
if (nextPage) {
  url = baseUrl + nextPage;
}
```

#### 💡 Tips:

* Detect pagination links
* Loop until `next` button disappears
* Scrape → Store → Then paginate

---

### 3. 🤖 Puppeteer for Dynamic Pages

Used in: `puppeteer-scraper-template/`, `multi-page-web-scraper/`

```js
await page.goto(url, { waitUntil: 'networkidle2' });
await page.waitForSelector('.post');
```

#### 💡 Best Practices:

* Use `waitForSelector()` before scraping content
* Use `{ waitUntil: 'networkidle2' }` for complete page load
* Use `page.evaluate()` for DOM-based scraping

---

### 4. 🔐 Login Scraping

Used in: `scraper-for-authenticated-site/`

```js
await page.type('input[name=email]', 'user@example.com');
await page.type('input[name=password]', 'pass');
await Promise.all([
  page.click('button[type=submit]'),
  page.waitForNavigation()
]);
```

#### 💡 Tips:

* Simulate login just like a user
* Wait for form submission + redirect
* Continue scraping after login success

---

### 5. 🌀 Infinite Scroll Logic

Used in: `infinite-scroll-web-scraper/`, `unsplash-home-scraper/`, `unsplash-search-scraper/`

```js
let prevHeight = 0;
while (true) {
  prevHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  const currHeight = await page.evaluate(() => document.body.scrollHeight);
  if (currHeight === prevHeight) break;
}
```

#### 💡 Tips:

* Scroll down slowly to allow lazy loading
* Delay with `setTimeout` after scroll
* Break when content stops loading

---

### 6. 📷 Advanced Image Scraping & Filtering

Used in: `unsplash-home-scraper/`, `unsplash-search-scraper/`

```js
const urls = new Set();
document.querySelectorAll('img').forEach(img => {
  const srcSet = img.getAttribute('srcset');
  const src = srcSet?.split(',').pop()?.split(' ')?.[0] || img.src;

  if (src && src.includes('images.unsplash.com')) {
    urls.add(src); // filter placeholder & logo images
  }
});
```

#### 💡 Key Tricks:

* Extract from `srcset` for high-quality images
* Avoid `data:` or low-res placeholders
* Filter using `includes('images.unsplash.com')`

---

### 7. 🆕 Load More Button Handling

Used in: `unsplash-search-scraper/`

```js
const clicked = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent?.toLowerCase().includes('load more'));
  if (btn) {
    btn.click();
    return true;
  }
  return false;
});
```

#### 💡 Tip:

* Use `Array.from` and `find()` to match button text
* Click only once before triggering infinite scroll

---

### 8. 📁 Folder Handling for Downloads

```js
const folder = path.join(__dirname, 'images', keyword);
if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
```

#### 💡 Use `recursive: true` for nested folders.

---

### 9. 💾 Streaming Image Downloads

```js
const writer = fs.createWriteStream(filename);
const response = await axios.get(url, { responseType: 'stream' });
response.data.pipe(writer);
```

#### 💡 Notes:

* Use `stream` to avoid memory bloat
* Chain `.pipe()` to write image directly
* Return a Promise to await write completion

---

## 📦 Project Logic Summary

### 🔍 `unsplash-home-scraper/`

* Scrapes trending images from homepage
* Uses infinite scroll technique
* Extracts unique `srcset` URLs (high-res only)
* Downloads them to `/images/` folder

### 🔎 `unsplash-search-scraper/`

* Accepts keyword via CLI: `node main.js cars`
* Goes to `https://unsplash.com/s/photos/cars`
* Clicks “Load More” button
* Scrolls infinitely
* Filters out ads, placeholders
* Saves images inside `/images/cars/`

---

## 🗂️ Folder-to-Tech Map

| Folder                    | Description                 | Tech Used         |
| ------------------------- | --------------------------- | ----------------- |
| `unsplash-home-scraper`   | Home page image scraper     | Puppeteer + Axios |
| `unsplash-search-scraper` | Keyword-based image scraper | Puppeteer + Axios |

---

## 📁 JSON/Image Storage Structure

```bash
/images/
  /cars/
    cars-img-1.jpg
    cars-img-2.jpg
  /cats/
    cats-img-1.jpg
```

---

## ✏️ Final Tips

* Use `Set()` to avoid duplicate URLs
* Always sanitize filenames (e.g., slugify keywords)
* Respect scraping ethics: throttle, avoid abuse
* Add `User-Agent` headers if needed

---

## 📘 Chapter-Based Multi-Page Scraping (Custom Pagination Pattern)

**Used in:** `o-level-mcqs-scraper/`

```js
while (chapterUrl) {
  await page.goto(chapterUrl, { waitUntil: 'networkidle2' });
  // Scrape current MCQs...
  const nextPageHref = await page.evaluate(() => {
    const activeItem = document.querySelector('.pagination .page-item.active');
    if (!activeItem) return null;

    const currentPageNum = parseInt(activeItem.innerText.trim());
    const pageLinks = Array.from(document.querySelectorAll('.pagination .page-item a'))
      .filter(el => !isNaN(parseInt(el.innerText.trim())));

    const lastPageNum = pageLinks.length > 0
      ? Math.max(...pageLinks.map(el => parseInt(el.innerText.trim())))
      : null;

    if (!lastPageNum || currentPageNum >= lastPageNum) return null;
    const activeIndex = pageLinks.findIndex(el => parseInt(el.innerText.trim()) === currentPageNum);
    const nextLink = pageLinks[activeIndex + 1];
    return nextLink?.getAttribute('href') || null;
  });

  chapterUrl = nextPageHref;
}
```

#### 🧠 What Makes It Special?

* Traditional pagination often uses **"Next"** links.
* This scraper smartly detects current and next **numbered pagination buttons**, enabling better control when **"Next" doesn’t exist or is unreliable**.
* Detects and **stops automatically** when no more pages are left, **avoiding dead links or unnecessary 404s**.

#### ✅ Real-World Usage:

* Perfect for **exam sites** or **e-learning platforms** with:

  * Structured chapters
  * Question banks with paginated MCQs
  * Complex URL structures per chapter

---

### 🔁 Multi-Chapter + Multi-Page Strategy

**Flow Summary:**

1. Starts at the main paper page.
2. Collects all chapter links.
3. Visits each chapter one by one.
4. Inside each chapter, loops through **all paginated pages**.
5. Scrapes every MCQ with:

   * Question number
   * English/Hindi text
   * Multiple options
   * Correct answer
6. Repeats for every chapter.
7. Stores everything in a **JSON file**, organized by chapters.

---

### 📁 Output JSON Format Example

```json
[
  {
    "chapter": "Introduction to Computer",
    "chapter_mcqs": [
      {
        "question_num": "Q.1",
        "question_eng": "What is a computer?",
        "question_hi": "कंप्यूटर क्या है?",
        "answers": ["Machine", "Animal", "Fruit", "Tree"],
        "correct_answer": "Machine"
      },
      ...
    ]
  },
  ...
]
```

---

### 🔍 Highlights:

| Feature                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| 📑 **Nested Chapters**    | Scrapes each chapter individually, grouped in final output |
| 🔁 **Paginated Pages**    | Smart detection of last page using button-based logic      |
| 🌐 **Dynamic Navigation** | Uses Puppeteer to load, wait, and scroll per page          |
| 🧠 **Real Exam Use**      | Extracted 6000+ MCQs for personal O-Level exam preparation |
| 💾 **Clean JSON Output**  | Easy to export or convert to CSV, Excel, or quiz platforms |

---

> 💡 Tip: To adapt for other papers, just change the `siteUrl` in the script, and repeat the process.

---

If this helped you, please ⭐️ the repo and keep learning.
Happy scraping! 🕷️

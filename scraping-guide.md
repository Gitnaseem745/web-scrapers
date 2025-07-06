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
| **fs**       | To write scraped data to `.json` files      |

---

## 🧰 Core Techniques & Concepts

### 1. ✅ Static Scraping with Axios + Cheerio
Used in: `axios-scraper-template/`, `static-multi-page-scraper/`

```js
const { data } = await axios.get(url);
const $ = cheerio.load(data);
const title = $('h1').text();
````

#### 💡 Things to Know:

* Use `.text()` for inner text
* Use `.attr('href')` for attributes
* Loop with `.each()` for elements like `.quote`

---

### 2. 🔁 Multi-Page Scraping (Pagination)

Used in: `static-multi-page-scraper/`, `multi-page-web-scraper/`, `articles-meta-scraper/`

```js
const nextPage = $('.pager .next a').attr('href');
if (nextPage) {
  url = baseUrl + nextPage;
} else {
  url = null; // Exit loop
}
```

#### 💡 Key Concepts:

* Detect "Next" button/link
* Use a `while (url)` loop
* Always scrape and store before moving to next page

---

### 3. 🤖 Puppeteer Basics for Dynamic Sites

Used in: `puppeteer-scraper-template/`, `multi-page-web-scraper/`, `articles-meta-scraper/`

```js
await page.goto(url, { waitUntil: 'networkidle2' });
await page.waitForSelector('.post');
const data = await page.evaluate(() => {
  return document.querySelector('h1').innerText;
});
```

#### 💡 Best Practices:

* Use `{ waitUntil: 'networkidle2' }` to wait for full content
* Always `waitForSelector()` before scraping
* Store results in arrays and write using `fs.writeFileSync()`

---

### 4. 🔐 Scraping Behind Login

Used in: `scraper-for-authenticated-site/`

```js
await page.goto(loginUrl);
await page.type('input[name="username"]', 'admin');
await page.type('input[name="password"]', 'admin');
await Promise.all([
  page.click('input[type="submit"]'),
  page.waitForNavigation()
]);
```

#### 💡 Notes:

* Handle login as if you were a real user
* Use `waitForNavigation()` after form submit
* Once logged in, continue normal scraping flow

---

### 5. 🌀 Infinite Scroll Scraping

Used in: `infinite-scroll-web-scraper/`

```js
let prevHeight;
while (true) {
  prevHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1500));
  const newHeight = await page.evaluate(() => document.body.scrollHeight);
  if (newHeight === prevHeight) break;
}
```

#### 💡 Key Ideas:

* Scroll to bottom in loop
* Wait for new content to load with `setTimeout`
* Break the loop when no new content is added

---

### 6. 🔗 Nested Scraping (Detail Pages)

Used in: `articles-meta-scraper/`, `deep-blog-scraper/`, `infinite-scroll-web-scraper/`

```js
for (const item of items) {
  const detailPage = await browser.newPage();
  await detailPage.goto(item.link);
  const fullContent = await detailPage.evaluate(() => {
    return document.querySelector('.article__content').innerHTML;
  });
  item.content = fullContent;
  await detailPage.close();
}
```

#### 💡 Tips:

* Don’t block the loop (use `await` carefully)
* Always `close()` opened pages
* Handle missing elements with optional chaining (`?.`)

---

## 🧪 Other Tricks & Useful Patterns

### ✅ Wait for full content

```js
await page.waitForSelector('.article__content');
```

### ✅ Save JSON with indentation

```js
fs.writeFileSync('file.json', JSON.stringify(data, null, 2), 'utf-8');
```

### ✅ Add User-Agent headers with Axios

```js
await axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    // other headers...
  }
});
```

---

## 🗂️ JSON Output Format Example

```json
[
  {
    "title": "How to Build a Blog",
    "description": "Step-by-step guide",
    "link": "https://example.com/article",
    "content": "<p>Full HTML here</p>",
    "scrapedAt": "2025-07-06T10:00:00.000Z"
  }
]
```

---

## 📁 Folder-to-Tech Map

| Folder                           | Key Feature               | Tool/Library    |
| -------------------------------- | ------------------------- | --------------- |
| `axios-scraper-template`         | Static scraping           | Axios + Cheerio |
| `puppeteer-scraper-template`     | Dynamic scraping          | Puppeteer       |
| `multi-page-web-scraper`         | Pagination                | Puppeteer       |
| `articles-meta-scraper`          | Full meta content         | Puppeteer       |
| `deep-blog-scraper`              | Nested articles scrape      | Puppeteer       |
| `scraper-for-authenticated-site` | Login-required scraping   | Puppeteer       |
| `infinite-scroll-web-scraper`    | Infinite scroll + nesting | Puppeteer       |

---

## 🧠 Final Advice

* Always start by **inspecting HTML manually**
* Use `console.log()` or screenshots to debug
* Scrape ethically: respect `robots.txt`, avoid aggressive scraping

---

If this helped you, consider ⭐️ starring the repo and keep scraping responsibly.

Happy scraping! 🕷️

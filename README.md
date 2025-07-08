# 🕸️ Web Scrapers Collection – By @Gitnaseem745

Welcome to a comprehensive collection of **real-world Web Scraping Projects** crafted with 💻 using `Node.js`, `Puppeteer`, `Cheerio`, and `Axios`. This repo is a progressive journey from beginner to advanced levels of scraping — covering everything from static blogs to authenticated logins and infinite scrolls.

GitHub: [Gitnaseem745/web-scrapers](https://github.com/Gitnaseem745/web-scrapers)

---

## 🧭 Folder Structure (Actual)

```bash
.
├── articles-meta-scraper/            # Level 2B - Article data with full content scraping
├── axios-scraper-template/           # Level 1 - Static scraper using Axios + Cheerio
├── deep-blog-scraper/                # Level 2A - Multi-page blog with nested content
├── infinite-scroll-web-scraper/      # Level 3B - Infinite scroll with author nested scraping
├── multi-page-web-scraper/           # Level 2A - Paginated content scraper
├── o-level-mqc-scraper/              # Level 3C+++ - Advance Paginated mcqs scraper
├── puppeteer-scraper-template/       # Level 1 - Basic Puppeteer template
├── scraper-for-authenticated-site/   # Level 3A - Scraper behind login page
├── static-multi-page-scraper/        # Level 1 - Cheerio multi-page static scraper
├── unsplash-home-scraper/            # Level 3C - Homepage infinite scroll image scraper
├── unsplash-search-scraper/          # Level 3C++ - Keyword-based image scraper with "Load More"
├── scraping-guide.md                 # Markdown guide to techniques used
└── main.js                           # Entrypoint
````

---

## 🧩 Projects Breakdown by Level

### ✅ Level 1 – Static Scrapers & Foundations

> Learn static scraping using Axios/Cheerio or Puppeteer on simple pages.

| Folder                        | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `axios-scraper-template/`     | Scraper for static HTML using Axios + Cheerio          |
| `puppeteer-scraper-template/` | Puppeteer scraper template for dynamic pages           |
| `static-multi-page-scraper/`  | Multi-page static scraper using Cheerio and pagination |

---

### 🔍 Level 2 – Pagination, Article Extraction, Nested DOM

> Dive into deeper blog scrapers, content nesting, and multi-page structures.

| Folder                    | Description                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `multi-page-web-scraper/` | Scrapes paginated blogs using Puppeteer                          |
| `articles-meta-scraper/`  | Scrapes articles with full page content (titles + body)          |
| `deep-blog-scraper/`      | Nested blog scraper with linked page details (e.g., author bios) |

---

### 🚀 Level 3 – Auth, Infinite Scroll, Nested Advance Pagination, and Deep Site Access

> Break into login-protected pages, infinite scroll content, and fully nested logic.

| Folder                            | Description                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `scraper-for-authenticated-site/` | Logs into site and scrapes paginated content                                   |
| `infinite-scroll-web-scraper/`    | Infinite scroll content scraper with author page nesting                       |
| `unsplash-home-scraper/`          | Scrapes trending homepage images by scrolling and downloading unique `srcset`  |
| `unsplash-search-scraper/`        | Keyword-based image scraper (clicks "Load More" → infinite scroll → downloads) |
| `o-level-mcq-scraper/`        | Chapter-based mcqs scraper (click "Load" + "Scroll" ) |

---

## ✨ Technologies Used

* `puppeteer`
* `axios` + `cheerio`
* `fs` for writing to `.json`
* JavaScript (`Node.js` environment)

---

## 📘 Documentation

📄 Check out [`scraping-guide.md`](./scraping-guide.md) for tips on:

* `waitForSelector`, `networkidle2`, infinite scroll logic
* Pagination loops
* Selecting and extracting nested data
* Common anti-scraping headers
* JSON storage tips
* Streaming image downloads

---

## 🤝 Contribute

Have a cool scraper idea or improvement?
Fork this repo → Make changes → Submit a PR.
Contributions are always welcome!

---

## 👨‍💻 Author

Built with ❤️ by [@Gitnaseem745](https://github.com/Gitnaseem745)

---

## ⭐️ Star the Repo

If this helped you learn scraping, please **⭐️ star** the repo to support the project and make it more discoverable 🙌

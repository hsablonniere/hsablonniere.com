import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// This script assumes you're running Eleventy in dev mode on port 8080
const port = 8080;

// List all pages
const collectionsJson = fs.readFileSync('_site/.collections.json', 'utf8');
const collections = JSON.parse(collectionsJson);
const pageList = Object.values(collections).flat();

async function generatePageImage (puppeteerPage, port, page) {

  const url = `http://localhost:${port}${page.url}`;

  console.log(url, '...');

  await puppeteerPage.goto(url);

  // Remove all styles
  const result = await puppeteerPage.evaluate(x => {
    const linkStylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    for (const $stylesheet of linkStylesheets) {
      $stylesheet.parentElement.removeChild($stylesheet);
    }
  });

  // Inject dedicated style for OG image
  await puppeteerPage.addStyleTag({ url: '../assets/css/article-og-image.css' });

  const pageDir = path.parse(page.inputPath).dir;

  // Prepare viewport for OpenGraph image
  // Those dimension seems to be the recommendation for Facebook/Twitter
  puppeteerPage.setViewport({ width: 1200, height: 630 });
  const opengraphImagePath = path.join(pageDir, 'opengraph.jpg');
  await puppeteerPage.screenshot({ path: opengraphImagePath });
  console.log('>', opengraphImagePath, 'DONE!');

  // Prepare viewport for atom feed image
  // Feedly seems to use 4/3 images
  puppeteerPage.setViewport({ width: 1200, height: 900 });
  const feedImagePath = path.join(pageDir, 'feed-preview.jpg');
  await puppeteerPage.screenshot({ path: feedImagePath });
  console.log('>', feedImagePath, 'DONE!');
}

// Start browser and init puppeteerPage
const browser = await puppeteer.launch({
  headless: 'new',
});
const puppeteerPage = await browser.newPage();

console.log('Generating images for articles...');

for (const page of pageList) {
  await generatePageImage(puppeteerPage, port, page);
}

console.log('ALL DONE');

browser.close();

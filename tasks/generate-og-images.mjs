import fs from 'fs';
import puppeteer from 'puppeteer';

// This script assumes you're runnin Eleventy in dev mode on port 8080
const port = 8080;

// List all pages
const collectionsJson = fs.readFileSync('_site/.collections.json', 'utf8');
const collections = JSON.parse(collectionsJson);
const pageList = Object.values(collections).flatMap((a) => a)

async function generateOgImageForPage (puppeteerPage, port, page) {

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

  // Generate run
  const imagePath = page.inputPath.replace(/\.md$/, '.og-img.jpg')
  await puppeteerPage.screenshot({ path: imagePath });

  console.log(url, 'DONE');
}

async function run ({ port, pageList }) {

  // Start browser and init puppeteerPage
  const browser = await puppeteer.launch();
  const puppeteerPage = await browser.newPage();

  // Prepare viewport for OpenGraph image
  // Those dimension seems to be the recommendation for Facebook/Twitter
  puppeteerPage.setViewport({ width: 1200, height: 630 });

  console.log('Generating OpenGraph images for articles...');

  for (const page of pageList) {
    await generateOgImageForPage(puppeteerPage, port, page);
  }

  await browser.close();

  console.log('ALL DONE');
};

run({ port, pageList })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

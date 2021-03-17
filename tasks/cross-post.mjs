import fs from 'fs';
import path from 'path';
import { transformHtml } from '../lib/html.mjs';
import * as devto from '../lib/devto.mjs';
import * as medium from '../lib/medium.mjs';

const { DEV_TO_API_KEY, MEDIUM_ACCESS_TOKEN } = process.env;
const CROSS_POST_DIR = '.cross-post';
const ORIGIN = 'https://www.hsablonniere.com';

async function run () {

  // For debug purposes
  try {
    fs.mkdirSync(CROSS_POST_DIR);
  }
  catch (e) {
  }

  // Reading articles collection from Eleventy
  const collectionsJson = fs.readFileSync('_site/.collections.json', 'utf8');
  const collections = JSON.parse(collectionsJson);
  const localArticleList = collections.article;

  for (const localArticle of localArticleList) {

    // Reading articles from dist so we have the "production" HTML with hashed filenames in URLs
    const distPath = localArticle.outputPath.replace('_site/', 'dist/');
    const html = fs.readFileSync(distPath, 'utf8');

    localArticle.content = await transformHtml(html);
    localArticle.canonicalUrl = ORIGIN + localArticle.url;
  }

  await updateDevto(localArticleList);
  await updateMedium(localArticleList);
};

async function updateDevto (localArticleList) {

  console.log('\nFetching remote articles on dev.to...\n');

  const remoteArticleList = await devto.getArticles(DEV_TO_API_KEY);

  for (const localArticle of localArticleList) {

    console.log(`Article ${localArticle.url}`);

    const remoteArticle = remoteArticleList.find((a) => a.canonical_url === localArticle.canonicalUrl);

    const frontMatter = ['---', `date: ${localArticle.date.replace(/-/g, '').slice(0, 8)}`, '---'].join('\n');
    // TODO: could be done properly with PostHTML
    const devtoContent = localArticle.content.replace(/^.*<\/h1>/ms, frontMatter);

    // For debug purposes
    const debugFilepath = path.join(CROSS_POST_DIR, localArticle.fileSlug + '.devto.html');
    fs.writeFileSync(debugFilepath, devtoContent);

    const articleBody = {
      article: {
        title: localArticle.title,
        // main_image: '',
        body_markdown: devtoContent,
        canonical_url: localArticle.canonicalUrl,
        description: localArticle.description,
        tags: [],
      },
    };

    if (remoteArticle == null) {
      console.log(`  => does not exist yet`);
      await devto.createArticle(DEV_TO_API_KEY, articleBody);
      console.log(`  => created successfully!`);
    }
    else {
      console.log(`  => already exists`);
      // TODO, we may use the same system as medium.com to prevent too many calls to dev.to's API
      await devto.updateArticle(DEV_TO_API_KEY, articleBody, remoteArticle.id);
      console.log(`  => updated successfully!`);
    }
  }
}

async function updateMedium (localArticleList) {

  console.log('\nFetching remote articles on medium.com...\n');

  const remoteArticleList = await medium.getArticles();

  for (const localArticle of localArticleList) {

    console.log(`Article ${localArticle.url}`);

    const remoteArticle = remoteArticleList.find((a) => a.canonicalUrl === localArticle.canonicalUrl);

    const crossPostBanner = `<p>ℹ️ INFO: <em>This article was originally posted <a href="${localArticle.canonicalUrl}">on my own site</a>.</em></p>`;
    // TODO: could be done properly with PostHTML
    const mediumContent = localArticle.content.replace('</h1>', '</h1>' + crossPostBanner);

    // For debug purposes
    const debugFilepath = path.join(CROSS_POST_DIR, localArticle.fileSlug + '.mediumcom.html');
    fs.writeFileSync(debugFilepath, mediumContent);

    const articleBody = {
      title: localArticle.title,
      contentFormat: 'markdown',
      content: mediumContent,
      canonicalUrl: localArticle.canonicalUrl,
      tags: [],
      publishStatus: 'draft',
    };

    const articleBodyChecksum = medium.getChecksum(articleBody);

    if (remoteArticle != null && remoteArticle.articleBodyChecksum === articleBodyChecksum) {
      console.log(`  => already exists and remote version is up to date`);
    }
    else if (remoteArticle == null) {
      console.log(`  => does not exist yet`);
      const { articleId } = await medium.createArticle(MEDIUM_ACCESS_TOKEN, articleBody, articleBodyChecksum);
      console.log(`  => created successfully - https://medium.com/p/${articleId}/edit`);
    }
    else {
      const { articleId } = await medium.updateArticle(MEDIUM_ACCESS_TOKEN, articleBody, articleBodyChecksum);
      console.log(`  => already exists but remote version is stale, manual copy/paste is required`);
      console.log(`  => Draft to copy: https://medium.com/p/${articleId}/edit`);
      console.log(`  => Published article to edit: https://medium.com/p/${remoteArticle.id}/edit`);
    }
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

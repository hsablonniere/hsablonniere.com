import fs from 'fs/promises';
import slugify from '@sindresorhus/slugify';

async function run () {

  const collectionsJson = await fs.readFile('_site/.collections.json');
  const collections = JSON.parse(collectionsJson);
  const articleList = collections.article;

  for (const article of articleList) {
    const titleSlug = slugify(article.title);
    const newFileSlug = `${titleSlug}--${article.id}`;
    if (newFileSlug !== article.fileSlug) {
      const oldPath = `pages/${article.fileSlug}`;
      const newPath = `pages/${newFileSlug}`;
      console.log(`Article [${article.id}] has a new title: "${article.title}"`);
      console.log(`  * moving ${oldPath}`);
      console.log(`  * to     ${newPath}`);
      await fs.rename(oldPath, newPath);
    }
  }
};

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

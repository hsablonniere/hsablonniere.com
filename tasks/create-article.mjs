import fs from 'fs/promises';
import { customAlphabet } from 'nanoid/async';

// No ambiguous 0 (vs o) or 1 vs (l)
const nanoid = customAlphabet('23456789abcdefghijklmnopqrstuvwxyz', 6);

async function run () {

  const articleId = await nanoid();
  const articleSlug = `untitled-article--${articleId}`;
  const publicationDate = new Date().toISOString().substr(0, 10);

  const articleTemplate = [
    '---',
    'id: ' + articleId,
    'title: Untitled article',
    'description: TODO',
    'date: ' + publicationDate,
    'tags: article',
    'layout: article.njk',
    '---',
    '',
    'TODO',
  ].join('\n');

  await fs.mkdir(`pages/${articleSlug}`);
  await fs.writeFile(`pages/${articleSlug}/index.md`, articleTemplate);
};

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import fs from 'fs';
import posthtml from 'posthtml';
import posthtmlUrls from 'posthtml-urls';
import { unescape } from 'html-escaper';

const { DEBUG, DEV_TO_API_KEY, MEDIUM_ACCESS_TOKEN } = process.env;
const CROSS_POST_DIR = '.cross-post';
const ORIGIN = 'https://www.hsablonniere.com';

async function run () {

  // For debug purposes
  if (DEBUG === 'true') {
    try {
      fs.mkdirSync(CROSS_POST_DIR);
    }
    catch (e) {
    }
  }

  // Reading articles collection from Eleventy
  const collectionsJson = fs.readFileSync('_site/.collections.json', 'utf8');
  const collections = JSON.parse(collectionsJson);
  const localArticleList = collections.article;

  for (const localArticle of localArticleList) {

    // Reading articles from dist so we have the "production" HTML with hashed filenames in URLs
    const distPath = localArticle.outputPath.replace('_site/', 'dist/');
    const htmlOutput = fs.readFileSync(distPath, 'utf8');

    localArticle.content = await transformHtml(htmlOutput);
  }

  await updateDevto(localArticleList);
  await updateMedium(localArticleList);
};

// Facts:
// * To cross-post to dev.to, you need markdown.
// * To cross-post to Medium, you can send markdown or HTML.
// * Both accept HTML in the markdown
// Using the original markdown to publish it has several problems:
// * the URLs for images don't have the "production" hashed filenames
// * if I introduce custom markdown extensions, I may need to convert them
// Solution => reuse the "production" HTML and convert stuffs if needed:
// * Extract the article from the <main>
// * Convert <pre> back to markdown code blocks so dev.to can highlight them (and medium can do nothing, lol)
// * Convert <video> tags into links to video
// * Add origin to absolute URLs
export async function transformHtml (html) {
  const plugins = [
    extractMain,
    removeCustomElements,
    normalizeImagesInParagraphs,
    removeElementByClass('publication-date'),
    removeElementByClass('deeplink'),
    convertPreToMarkdownCodeBlocks,
    convertVideosToLinks,
    addOriginToAbsoluteUrls,
  ];
  const res = await posthtml(plugins).process(html);
  return res.html;
}

function extractMain (tree) {
  let body;
  tree.match({ attrs: { 'class': 'main' } }, (node) => {
    body = node.content;
    return node;
  });
  return body;
}

// Custom elements seem to cause some troubles with Dev.to (when used with a fallback image in the light DOM)
function removeCustomElements (tree) {
  tree.match({ tag: /.*-.*/ }, (node) => {
    return node.content;
  });
  return tree;
}

// In some articles, we're using raw `<img>` tags inside custom elements as a fallback
// When those `<img>` tags have spaces around inside the parent paragraph, Dev.to seems confused
function normalizeImagesInParagraphs (tree) {
  tree.match({ tag: 'p' }, (node) => {

    const img = node.content.flat().find(({ tag }) => tag === 'img');
    const contentIsOnlyTextAndImg = node.content.flat().every((child) => {
      return (typeof child === 'string')
        ? child.trim() === ''
        : child === img;
    });

    if (contentIsOnlyTextAndImg) {
      node.content = [img];
    }

    return node;
  });
  return tree;
}

function removeElementByClass (cssClass) {
  return (tree) => {
    tree.match({ attrs: { 'class': cssClass } }, (node) => []);
    return tree;
  };
}

// TODO, investigate when using script tags inside code samples
function convertPreToMarkdownCodeBlocks (tree) {
  tree.match({ tag: 'pre' }, (node) => {
    const lang = node.attrs.class.replace('language-', '');
    const rawContent = getText(node);
    const content = (lang === 'html')
      ? unescape(rawContent)
      : rawContent;
    return [
      '\n\n',
      '```' + lang + '\n',
      content + '\n',
      '```\n\n',
    ];
  });
  return tree;
}

export function getText (node) {
  if (node.content != null) {
    return node.content.map((n) => getText(n)).join('');
  }
  else {
    return (node.tag === 'br') ? '\n' : node;
  }
}

// Dev.to and Medium only support embeds from YouTube, Vimeo...
// https://github.com/forem/forem/issues/1885
// https://github.com/forem/forem/pull/1928
function convertVideosToLinks (tree) {
  tree.match({ tag: 'video' }, (node) => {
    const videoSrc = node.content.find(({ tag }) => tag === 'source').attrs.src;
    return {
      tag: 'p',
      content: [
        {
          tag: 'a',
          attrs: { href: ORIGIN + videoSrc },
          content: ['📺 Open the video'],
        },
      ],
    };
  });
  return tree;
}

const addOriginToAbsoluteUrls = posthtmlUrls({
  eachURL (url, attr, element) {
    return url.startsWith('/')
      ? ORIGIN + url
      : url;
  },
});

export async function removeTitle (html) {
  const plugins = [
    (tree) => {
      tree.match({ tag: 'h1' }, (node) => []);
      return tree;
    },
  ];
  const res = await posthtml(plugins).process(html);
  return res.html;
}

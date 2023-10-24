import posthtml from 'posthtml';
import posthtmlUrls from 'posthtml-urls';
import { unescape } from 'html-escaper';

const { DEV_TO_API_KEY, MEDIUM_ACCESS_TOKEN } = process.env;
const CROSS_POST_DIR = '.cross-post';
const ORIGIN = 'https://www.hsablonniere.com';

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
export async function transformHtml (html, options = {}) {

  const plugins = [
    extractMain,
    removeElementByTagName('h1'),
    removeElementByClass('publication-date'),
    simplifyHeadings,
    removeCustomElements,
    normalizeImagesInParagraphs,
    convertPreToMarkdownCodeBlocks,
    addOriginToAbsoluteUrls,
  ];

  if (options.videos !== true) {
    plugins.push(convertVideosToLinks);
  }

  const res = await posthtml(plugins).process(html);
  return res.html.trim();
}

function extractMain (tree) {
  let body;
  tree.match({ attrs: { 'class': 'main' } }, (node) => {
    body = node.content;
    return node;
  });
  return body;
}

function removeElementByTagName (tagName) {
  return (tree) => {
    tree.match({ tag: tagName }, (node) => []);
    return tree;
  };
}

function removeElementByClass (cssClass) {
  return (tree) => {
    tree.match({ attrs: { 'class': cssClass } }, (node) => []);
    return tree;
  };
}

function simplifyHeadings (tree) {

  function transformNode (node) {
    delete node.attrs;
    node.content = node.content.flatMap((node) => {
      return (node.content != null)
        ? node.content
        : node;
    });
    return node;
  }

  tree.match({ tag: 'h1' }, transformNode);
  tree.match({ tag: 'h2' }, transformNode);
  tree.match({ tag: 'h3' }, transformNode);
  tree.match({ tag: 'h4' }, transformNode);
  tree.match({ tag: 'h5' }, transformNode);
  tree.match({ tag: 'h6' }, transformNode);

  return tree;
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

// TODO, investigate when using script tags inside code samples
function convertPreToMarkdownCodeBlocks (tree) {
  tree.match({ tag: 'pre' }, (node) => {
    const lang = node.attrs.class.replace('language-', '');
    const rawContent = getText(node);
    const content = (lang === 'html')
      ? unescape(rawContent)
      : rawContent;
    return [
      '\n',
      '```' + lang + '\n',
      content + '\n',
      '```\n',
    ];
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

// Medium only support embeds from YouTube, Vimeo...
function convertVideosToLinks (tree) {
  tree.match({ tag: 'video' }, (node) => {
    const videoSrc = node.content.find(({ tag }) => tag === 'source').attrs.src;
    return {
      tag: 'p',
      content: [
        {
          tag: 'a',
          attrs: { href: videoSrc },
          content: ['📺 Open the video'],
        },
      ],
    };
  });
  return tree;
}

function getText (node) {
  if (node.content != null) {
    return node.content.map((n) => getText(n)).join('');
  }
  else {
    return (node.tag === 'br') ? '\n' : node;
  }
}

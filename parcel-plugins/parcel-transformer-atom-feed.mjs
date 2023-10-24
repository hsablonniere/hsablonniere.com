// This Transformer plugin fixes a few problems with atom feeds:
// * rewrite <webfeeds:icon> so the URL gets the hashed filename
// * rewrite HTML inside <content type="html"> so it gets URLs with hashed filenames (images and videos)

import path from 'path';
import posthtml from 'posthtml';
import { escape, unescape } from 'html-escaper';
import { SOURCE_DIR } from './common.mjs';
import { createPostHtmlTransformer } from './common-posthtml-transformer.mjs';

export default createPostHtmlTransformer((asset) => {

  const assetDir = path.parse(asset.filePath).dir;

  function transformWebfeedsIconNode (node) {

    // NOTE: We should check for a startsWith origin of the site
    const url = new URL(node.content);
    const absolutePath = path.join(SOURCE_DIR, url.pathname);
    const relativePath = './' + path.relative(assetDir, absolutePath);

    // Create a relative URL dependency, so it's linked to the image
    const idForRelativePath = asset.addURLDependency(relativePath);

    // Rewrite the URL with the new relative path id
    node.content = url.origin + idForRelativePath;

    return node;
  }

  function transformContentHtmlNode (node) {

    const encodedHtmlString = node.content;
    const htmlString = unescape(encodedHtmlString);

    const transformedHtmlString = transformEncodedHtml(htmlString, asset, SOURCE_DIR, assetDir);
    const encodedTransformedHtmlString = escape(transformedHtmlString);
    node.content = encodedTransformedHtmlString;

    return node;
  }

  return (tree) => {
    tree.match({ tag: 'webfeeds:icon' }, transformWebfeedsIconNode);
    tree.match({ tag: 'content', attrs: { type: 'html' } }, transformContentHtmlNode);
    return tree;
  };
});

function transformEncodedHtml (htmlString, asset, sourceDir, assetDir) {

  function transformNode (node) {

    // NOTE: We should check for a startsWith origin of the site
    const url = new URL(node.attrs.src);
    const absolutePath = path.join(sourceDir, url.pathname);
    const relativePath = path.relative(assetDir, absolutePath);

    // Create a new URL dependency, with relative path, so it's linked to the image
    const idForRelativePath = asset.addURLDependency(relativePath);

    // Rewrite the URL with the new relative path ID
    node.attrs.src = url.origin + idForRelativePath;

    return node;
  }

  const plugins = [
    (tree) => {
      tree.match({ tag: 'img' }, transformNode);
      tree.match({ tag: 'source' }, transformNode);
      return tree;
    },
  ];

  const res = posthtml(plugins).process(htmlString, { sync: true });
  return res.html;
}

// This Transformer plugin transforms <link rel="stylesheet"> tags into <style> tags if the original CSS file size is below a given threshold.
// Requirements:
// * it needs to run before "@parcel/transformer-html" so it can work on original HTML URLs
// * it needs "@parcel/transformer-css" and "@parcel/packager-css" on CSS files to work properly

import fs from 'fs';
import path from 'path';
import { createPostHtmlTransformer } from './common-posthtml-transformer.mjs';

const SIZE_THRESHOLD = 5000;

export default createPostHtmlTransformer(async (asset) => {

  const assetDir = path.parse(asset.filePath).dir;

  function transformNode (node) {

    const stylesheetHref = node.attrs.href;

    const stylesheetPath = path.resolve(assetDir, stylesheetHref);
    const stats = fs.statSync(stylesheetPath);

    // Don't inline when raw CSS is over SIZE_THRESHOLD (bytes)
    if (stats.size >= SIZE_THRESHOLD) {
      return node;
    }

    node.tag = 'style';
    delete node.attrs.href;
    delete node.attrs.rel;

    // This will let parcel inline the file
    node.content = [`@import "${stylesheetHref}"`];

    return node;
  }

  return (tree) => {
    tree.match({ tag: 'link', attrs: { rel: 'stylesheet' } }, transformNode);
    return tree;
  };
});

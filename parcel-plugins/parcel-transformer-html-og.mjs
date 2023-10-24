// By default, parcel doesn't handle absolute URLs with OpenGraph meta tags.
// This Transformer plugin replaces IDs set by "@parcel/transformer-html" with new IDs for relative paths.
// Requirements:
// * it needs to run after "@parcel/transformer-html" so it can work with IDs

import path from 'path';
import { createPostHtmlTransformer } from './common-posthtml-transformer.mjs';
import { SOURCE_DIR } from './common.mjs';

export default createPostHtmlTransformer(async (asset) => {

  const assetDir = path.parse(asset.filePath).dir;

  function transformNode (node) {

    const idForImageFullUrl = node.attrs.content;
    const imageUrlString = asset.getDependencies().find((d) => d.id === idForImageFullUrl);
    const imageUrl = new URL(imageUrlString.specifier);
    const imageAbsolutePath = path.join(SOURCE_DIR, imageUrl.pathname);
    const imageRelativePath = path.relative(assetDir, imageAbsolutePath);

    // Create a new URL dependency, with relative path, so it's linked to the image
    const idForRelativePath = asset.addURLDependency(imageRelativePath);

    // Rewrite the URL with the new relative path ID
    node.attrs.content = imageUrl.origin + idForRelativePath;

    return node;
  }

  return (tree) => {
    tree.match({ tag: 'meta', attrs: { property: 'og:image' } }, transformNode);
    tree.match({ tag: 'meta', attrs: { name: 'twitter:image' } }, transformNode);
    return tree;
  };
});

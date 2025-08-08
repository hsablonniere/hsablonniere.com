// By default, parcel doesn't handle absolute URLs with OpenGraph meta tags.
// This Transformer plugin replaces IDs set by "@parcel/transformer-html" with new IDs for relative paths.
// Requirements:
// * it needs to run after "@parcel/transformer-html" so it can work with IDs

import { createPostHtmlTransformer } from './common-posthtml-transformer.mjs';

export default createPostHtmlTransformer(async (asset) => {

  function transformNode (node) {

    const imageRelativePath = './opengraph.jpg';

    // Create a new URL dependency, with relative path, so it's linked to the image
    const idForRelativePath = asset.addURLDependency(imageRelativePath);

    // Rewrite the URL with the new relative path ID
    node.attrs.content = 'https://www.hsablonniere.com' + idForRelativePath;

    return node;
  }

  return (tree) => {
    tree.match({ tag: 'meta', attrs: { property: 'og:image' } }, transformNode);
    tree.match({ tag: 'meta', attrs: { name: 'twitter:image' } }, transformNode);
    return tree;
  };
});

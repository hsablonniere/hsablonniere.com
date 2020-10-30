const path = require('path');
const posthtml = require('posthtml');
const { escape, unescape } = require('html-escaper');
const { Transformer } = require('@parcel/plugin');

module.exports = new Transformer({

  async transform ({ asset, options }) {

    const rootDir = options.entryRoot;
    const assetDir = path.parse(asset.filePath).dir;

    const atomXmlString = await asset.getCode();

    const transformedAtomXmlString = transformAtomXml(atomXmlString, asset, rootDir, assetDir);
    asset.setCode(transformedAtomXmlString);

    return [asset];
  },

});

function transformAtomXml (atomXmlString, asset, rootDir, assetDir) {

  const plugins = [
    (tree) => {
      tree.match({ tag: 'webfeeds:icon' }, (node) => {

        // NOTE: We should check for a startsWith origin of the site
        const url = new URL(node.content);
        const absolutePath = path.join(rootDir, url.pathname);
        const relativePath = './' + path.relative(assetDir, absolutePath);

        // Create a relative URL dependency, so it's linked to the image
        const idForRelativePath = asset.addURLDependency(relativePath);

        // Rewrite the URL with the new relative path id
        node.content = url.origin + idForRelativePath;

        return node;
      });
      tree.match({ tag: 'content', attrs: { type: 'html' } }, (node) => {

        const encodedHtmlString = node.content;
        const htmlString = unescape(encodedHtmlString);

        const transformedHtmlString = transformEncodedHtml(htmlString, asset, rootDir, assetDir);
        const encodedTransformedHtmlString = escape(transformedHtmlString);
        node.content = encodedTransformedHtmlString;

        return node;
      });
      return tree;
    },
  ];

  const res = posthtml(plugins).process(atomXmlString, { sync: true, xmlMode: true, closingSingleTag: 'slash' });
  return res.html;
}

function transformEncodedHtml (htmlString, asset, rootDir, assetDir) {

  function patchNode (node) {

    // NOTE: We should check for a startsWith origin of the site
    const url = new URL(node.attrs.src);
    const absolutePath = path.join(rootDir, url.pathname);
    const relativePath = './' + path.relative(assetDir, absolutePath);

    // Create a relative URL dependency, so it's linked to the image
    const idForRelativePath = asset.addURLDependency(relativePath);

    // Rewrite the URL with the new relative path id
    node.attrs.src = url.origin + idForRelativePath;

    return node;
  }

  const plugins = [
    (tree) => {
      tree.match({ tag: 'img' }, patchNode);
      tree.match({ tag: 'source' }, patchNode);
      return tree;
    },
  ];

  const res = posthtml(plugins).process(htmlString, { sync: true });
  return res.html;
}

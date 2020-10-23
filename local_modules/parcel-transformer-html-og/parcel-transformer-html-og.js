// The HTML transformer doesn't handle absolute URLs with OpenGraph meta tags
// This plugin replaces ids set by HTML transformer with ids for relative paths

const fs = require('fs');
const nullthrows = require('nullthrows');
const parse = require('posthtml-parser');
const path = require('path');
const posthtml = require('posthtml');
const render = require('posthtml-render');
const semver = require('semver');
const { Transformer } = require('@parcel/plugin');

const SIZE_THRESHOLD = 5000;

module.exports = new Transformer({

  canReuseAST ({ ast }) {
    return ast.type === 'posthtml' && semver.satisfies(ast.version, '^0.4.0');
  },

  async parse ({ asset }) {
    return {
      type: 'posthtml',
      version: '0.4.1',
      program: parse(await asset.getCode(), {
        lowerCaseAttributeNames: true,
      }),
    };
  },

  async transform ({ asset, options }) {

    const rootDir = options.entryRoot;
    const assetDir = path.parse(asset.filePath).dir;

    function patchMetaNode (node) {

      // NOTE: We should check for a startsWith origin of the site
      const idForFullUrlDependency = node.attrs.content;
      const fullUrlDependency = asset.getDependencies().find((d) => d.id === idForFullUrlDependency);
      const url = new URL(fullUrlDependency.moduleSpecifier);
      const absolutePath = path.join(rootDir, url.pathname);
      const relativePath = './' + path.relative(assetDir, absolutePath);

      // Create a new URL dependency but this time relative, so it's linked to the image
      const idForRelativePath = asset.addURLDependency(relativePath);
      // Override the previous id corresponding to a full URL (with origin and domain etc...)
      // with the new relative path id
      node.attrs.content = url.origin + idForRelativePath;

      return node;
    }

    const plugins = [
      (tree) => {

        tree.match({ tag: 'meta', attrs: { property: 'og:image' } }, patchMetaNode);
        tree.match({ tag: 'meta', attrs: { name: 'twitter:image' } }, patchMetaNode);

        return tree;
      },
    ];

    let ast = nullthrows(await asset.getAST());
    let res = await posthtml(plugins).process(ast.program, {
      skipParse: true,
      plugins,
    });

    asset.setAST({
      type: 'posthtml',
      version: '0.4.1',
      program: JSON.parse(JSON.stringify(res.tree)), // posthtml adds functions to the AST that are not serializable
    });

    return [asset];
  },

  generate ({ ast }) {
    return {
      content: render(ast.program),
    };
  },
});

// Most of this file is inspired from https://github.com/parcel-bundler/parcel/blob/v2/packages/transformers/posthtml/src/PostHTMLTransformer.js
// The goal is to inline files if their size is below a given threshold
// We cannot do this as a simple PostCSS plugin because we need access to the HTML source filepath in order to resolve `<link>` file paths and get the size

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

  async transform ({ asset }) {

    const assetDir = path.parse(asset.filePath).dir;

    const plugins = [
      (tree) => {
        tree.match({ tag: 'link', attrs: { rel: 'stylesheet' } }, (node) => {

          const stylesheetPath = path.resolve(assetDir, node.attrs.href);
          const stats = fs.statSync(stylesheetPath);

          // Don't inline when raw CSS is over SIZE_THRESHOLD (bytes)
          if (stats.size >= SIZE_THRESHOLD) {
            return node;
          }

          node.tag = 'style';
          node.content = [`@import "${node.attrs.href}"`];
          delete node.attrs.href;
          delete node.attrs.rel;
          return node;
        });
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

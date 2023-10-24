// This is a helper to create a parcel Transformer using posthtml.
// Writing a posthtml plugin is often not enough when you need to work on dependencies.
// Inspired by https://github.com/parcel-bundler/parcel/blob/v2/packages/transformers/html/src/HTMLTransformer.js

import { Transformer } from '@parcel/plugin';
import posthtml from 'posthtml';
import { parser as parseWithPostHtml } from 'posthtml-parser';
import { render as renderWithPostHtml } from 'posthtml-render';

const AST_TYPE = 'posthtml';
const AST_VERSION = '0.4.1';

export function createPostHtmlTransformer (getPlugin) {

  return new Transformer({

    // A bit too simple but it works for now
    canReuseAST ({ ast }) {
      return (ast.type === AST_TYPE) && (ast.version === AST_VERSION);
    },

    // Parse HTML files, just like "@parcel/transformer-html"
    async parse ({ asset }) {
      return {
        type: AST_TYPE,
        version: AST_VERSION,
        program: parseWithPostHtml(await asset.getCode(), {
          lowerCaseTags: true,
          lowerCaseAttributeNames: true,
          sourceLocations: true,
          xmlMode: asset.type === 'xml',
        }),
      };
    },

    async transform ({ asset }) {

      const plugin = await getPlugin(asset);

      const ast = await asset.getAST();
      const res = await posthtml([plugin]).process(ast.program, {
        skipParse: true,
      });

      asset.setAST({
        ...ast,
        // posthtml adds functions to the AST that are not serializable
        program: JSON.parse(JSON.stringify(res.tree)),
      });

      return [asset];
    },

    // Render HTML files, just like "@parcel/transformer-html"
    generate ({ ast, asset }) {
      return {
        content: renderWithPostHtml(ast.program, {
          closingSingleTag: asset.type === 'xml' ? 'slash' : undefined,
        }),
      };
    },
  });
}

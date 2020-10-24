module.exports = {

  // This is basically the only rule that has a significan impact
  collapseWhitespace: 'aggressive',

  // Not really effective in this context:
  collapseAttributeWhitespace: true,
  collapseBooleanAttributes: true,
  deduplicateAttributeValues: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,

  // vv Not really useful
  // With true => small impact on raw, tiny impact on gzip, bigger size on brotli
  mergeStyles: false,

  // vv Not really useful
  // With true => small impact on raw, tiny impact on gzip, bigger size on brotli
  removeAttributeQuotes: false,

  // vv Not really useful
  // With 'alphabetical' => +5 bytes on brotli, -3 bytes on gzip
  sortAttributesWithLists: false,

  // vv We don't really need those
  // mergeScripts: false,
  // minifyCss: {},
  // minifyJs: {},
  // minifyJson: {},
  // minifySvg: {},
  // minifyUrls: false,
  // removeUnusedCss: false,

  // vv This one does not work (and it does not work on all tags anyway)
  // removeOptionalTags: false,
};

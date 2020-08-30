'use strict';

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy(`src/assets`);
  eleventyConfig.addPassthroughCopy({ 'src/root-files': '.' });

  return {
    dir: {
      output: '_site',
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
    },
  };
};

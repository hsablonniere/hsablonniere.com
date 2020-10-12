'use strict';

const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy('pages/**/*.{jpg,png,gif,svg,ico,css,mp4}');

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPassthroughCopy({ 'node_modules/prismjs-github/scheme.css': 'assets/css/prismjs-github.css' });

  return {
    dir: {
      output: '_site',
      input: 'pages',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
    },
  };
};

'use strict';

const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const emojiReadTime = require('@11tyrocks/eleventy-plugin-emoji-readtime');

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy('pages/**/*.{jpg,png,gif,svg,ico,css,mp4,txt,json}');

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPassthroughCopy({ 'node_modules/prismjs-github/scheme.css': 'assets/css/prismjs-github.css' });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(emojiReadTime, { showEmoji: false });

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

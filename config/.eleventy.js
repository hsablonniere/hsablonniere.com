'use strict';

const emojiReadTime = require('@11tyrocks/eleventy-plugin-emoji-readtime');
const markdownIt = require('markdown-it');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const slugify = require('@sindresorhus/slugify');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy('pages/**/*.{jpg,png,gif,svg,ico,css,mp4,txt,json,js}');

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPassthroughCopy({ 'node_modules/prismjs-github/scheme.css': 'assets/css/prismjs-github.css' });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(emojiReadTime, { showEmoji: false });

  const markdownItAnchor = require('markdown-it-anchor');
  // https://www.toptal.com/designers/htmlarrows/punctuation/section-sign/
  const markdownItAnchorOptions = {
    permalink: true,
    permalinkClass: 'deeplink',
    permalinkSymbol: '&#xa7;&#xFE0E;',
    level: [2, 3, 4],
    slugify,
  };

  const md = markdownIt({ html: true })
    .use(markdownItAnchor, markdownItAnchorOptions);
  eleventyConfig.setLibrary('md', md);

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

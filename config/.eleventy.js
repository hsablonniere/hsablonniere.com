'use strict';

const emojiReadTime = require('@11tyrocks/eleventy-plugin-emoji-readtime');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const slugify = require('@sindresorhus/slugify');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

module.exports = function (eleventyConfig) {

  // Copy static assets
  eleventyConfig.addPassthroughCopy('pages/**/*.{jpg,png,gif,svg,ico,css,mp4,txt,json,js}');

  // Syntax highlighting...
  eleventyConfig.addPlugin(syntaxHighlight);
  // with GitHub theme (via prismjs)
  eleventyConfig.addPassthroughCopy({ 'node_modules/prismjs-github/scheme.css': 'assets/css/prismjs-github.css' });

  // Generate an RSS feedn
  eleventyConfig.addPlugin(pluginRss);

  // Add an estimated reading time
  eleventyConfig.addPlugin(emojiReadTime, { showEmoji: false });

  const md = markdownIt({ html: true })
    // Add anchors to headings
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink(),
      level: [2, 3, 4],
      slugify,
    });

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

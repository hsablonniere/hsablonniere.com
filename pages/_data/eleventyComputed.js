const path = require('path');

const dtfLong = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' });
const dtfShort = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' });

module.exports = {
  formattedDate: (data) => dtfLong.format(data.page.date),
  shortDate: (data) => dtfShort.format(data.page.date),
  githubEditUrl: (data) => new URL(data.page.inputPath, 'https://github.com/hsablonniere/hsablonniere.com/blob/master/').toString(),
  // Used in includes so we can keep relative paths
  relativeRoot: (data) => {
    return (data.page.url != null)
      ? path.relative(data.page.url, '/') || '.'
      : '/';
  },
};

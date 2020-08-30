'use strict';

const nodeStatic = require('node-static');

const file = new nodeStatic.Server('./_site', {
  gzip: true,
  serverInfo: '',
  headers: {
    'cache-control': 'public,must-revalidate,no-cache,max-age=0',
  },
});

require('http')
  .createServer((request, response) => {
    request
      .addListener('end', () => {
        return file.serve(request, response);
      })
      .resume();
  })
  .listen(process.env.PORT || 8080);

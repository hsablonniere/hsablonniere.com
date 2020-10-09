import http from 'http';
import { cacheControl } from 'hititipi/src/middlewares/cache-control.js';
import { chainAll } from 'hititipi/src/middlewares/chain-all.js';
import { chainUntilResponse } from 'hititipi/src/middlewares/chain-until-response.js';
import { contentEncoding } from 'hititipi/src/middlewares/content-encoding.js';
import { contentLength } from 'hititipi/src/middlewares/content-length.js';
import { csp } from 'hititipi/src/middlewares/csp.js';
import { hititipi } from 'hititipi';
import { hsts, ONE_YEAR } from 'hititipi/src/middlewares/hsts.js';
import { keepAlive } from 'hititipi/src/middlewares/keep-alive.js';
import { logRequest } from 'hititipi/src/middlewares/log-request.js';
import { notModified } from 'hititipi/src/middlewares/not-modified.js';
import { permissionsPolicy } from 'hititipi/src/middlewares/permissions-policy.js';
import { redirectHttps } from 'hititipi/src/middlewares/redirect-https.js';
import { redirectNormalizedPath } from 'hititipi/src/middlewares/redirect-normalized-path.js';
import { referrerPolicy } from 'hititipi/src/middlewares/referrer-policy.js';
import { serverName } from 'hititipi/src/middlewares/server-name.js';
import { socketId } from 'hititipi/src/middlewares/socket-id.js';
import { staticFile } from 'hititipi/src/middlewares/static-file.js';
import { xContentTypeOptions } from 'hititipi/src/middlewares/x-content-type-options.js';
import { xFrameOptions } from 'hititipi/src/middlewares/x-frame-options.js';
import { xXssProtection } from 'hititipi/src/middlewares/x-xss-protection.js';
import { redirectWww } from 'hititipi/src/middlewares/redirect-www.js';

const PORT = process.env.PORT || 8080;

function ifProduction (middleware) {
  return () => {
    if (process.env.NODE_ENV === 'production') {
      return middleware;
    }
  };
}

async function run () {

  http
    .createServer(
      hititipi(
        logRequest(
          chainAll([
            serverName({ serverName: 'hititipi' }),
            socketId(),
            keepAlive({ max: 5, timeout: 100 }),
            referrerPolicy('same-origin'),
            permissionsPolicy(),
            xContentTypeOptions({ nosniff: true }),
            xFrameOptions('NONE'),
            xXssProtection({ enabled: true, blockMode: true }),
            csp(),
            ifProduction(hsts({ maxAge: ONE_YEAR, includeSubDomains: true })),
            chainUntilResponse([
              ifProduction(redirectHttps()),
              (context) => {
                if (context.requestUrl.hostname.endsWith('hsablonniere.com')) {
                  return redirectWww;
                }
              },
              redirectNormalizedPath(),
              staticFile({ root: '_site' }),
            ]),
            (context) => {
              return context.responseHeaders['content-type'] === 'text/html'
                ? cacheControl({ 'public': true, 'must-revalidate': true, 'max-age': 0 })
                : cacheControl({ 'public': true, 'max-age': 10 });
            },
            contentEncoding({ gzip: true, brotli: true }),
            contentLength(),
            notModified({ etag: true, lastModified: true }),
            (context) => {
              if (context.responseStatus == null) {
                return { ...context, responseStatus: 404 };
              }
            },
          ]),
        ),
      ),
    )
    .listen(PORT);

  console.log(`Started server on localhost:${PORT}`);
}

run()
  .catch(console.error);

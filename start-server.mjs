import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { cacheControl } from 'hititipi/src/middlewares/cache-control.js';
import { chainAll } from 'hititipi/src/middlewares/chain-all.js';
import { chainUntilResponse } from 'hititipi/src/middlewares/chain-until-response.js';
import { contentEncoding } from 'hititipi/src/middlewares/content-encoding.js';
import { contentLength } from 'hititipi/src/middlewares/content-length.js';
import { hititipi } from 'hititipi';
import { isHtml, isScriptable } from 'hititipi/src/lib/content-type.js';
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

function redirectBasedOnHash (options) {

  const absoluteRootPath = path.resolve(process.cwd(), options.root);

  return async (context) => {

    if (context.requestMethod !== 'HEAD' && context.requestMethod !== 'GET') {
      return;
    }

    const rootEntries = await fs.readdir(absoluteRootPath);

    const [all, id] = context.requestUrl.pathname.match(/^\/(?:.+--)?([2-9a-z]{6})\/$/) || [];
    const newPathname = rootEntries.find((entry) => entry.endsWith('--' + id));

    if (newPathname == null) {
      return;
    }

    const redirectUrl = new URL(`/${newPathname}/`, context.requestUrl);
    return {
      ...context, responseStatus: 301, responseHeaders: {
        ...context.responseHeaders,
        'location': redirectUrl.toString(),
      },
    };
  };
}

export function csp (options = {}) {

  return async (context) => {

    const contentTypeHeader = context.responseHeaders['content-type'];
    if (!isHtml(contentTypeHeader) && !isScriptable(contentTypeHeader)) {
      return;
    }

    const cspHeader = [
      `default-src 'none'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self'`,
      `media-src 'self'`,
      `manifest-src 'self'`,
      `frame-ancestors 'none'`,
      `base-uri 'none'`,
      'upgrade-insecure-requests',
      'block-all-mixed-content',
      // Not sure about those vv
      // 'disown-opener',
      // 'plugin-types',
    ]
      .filter((a) => a != null)
      .join(';');

    if (cspHeader !== '') {
      const responseHeaders = { ...context.responseHeaders, 'content-security-policy': cspHeader };
      return { ...context, responseHeaders };
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
            xContentTypeOptions({ nosniff: true }),
            xFrameOptions('DENY'),
            ifProduction(hsts({ maxAge: ONE_YEAR, includeSubDomains: true })),
            chainUntilResponse([
              ifProduction(redirectHttps()),
              (context) => {
                if (context.requestUrl.hostname.endsWith('hsablonniere.com')) {
                  return redirectWww;
                }
              },
              redirectNormalizedPath(),
              staticFile({ root: 'dist', enableRange: true }),
              redirectBasedOnHash({ root: 'dist' }),
            ]),
            permissionsPolicy(),
            xXssProtection({ enabled: true, blockMode: true }),
            csp(),
            (context) => {
              return isHtml(context.responseHeaders['content-type'])
                ? cacheControl({ 'max-age': 180 })
                : cacheControl({ 'max-age': ONE_YEAR, immutable: true });
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

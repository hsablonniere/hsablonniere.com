function fetchDevtoApi (apiKey, method, path, body) {
  const options = {
    method,
    headers: { 'api-key': apiKey },
  };
  if (body != null) {
    options.body = JSON.stringify(body);
    options.headers['content-type'] = 'application/json';
  }
  return fetch(`https://dev.to/api${path}`, options)
    .then(async (r) => {
      if (r.status > 400) {
        const message = await r.text();
        throw new Error(`Error ${r.status}: ${message}`);
      }
      return r.json();
    });
}

export async function getArticles (apiKey) {
  return fetchDevtoApi(apiKey, 'get', '/articles/me/all');
}

export function createArticle (apiKey, articleBody) {
  return fetchDevtoApi(apiKey, 'post', '/articles', articleBody);
}

export function updateArticle (apiKey, articleBody, articleId) {
  return fetchDevtoApi(apiKey, 'put', `/articles/${articleId}`, articleBody);
}


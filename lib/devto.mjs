import superagent from 'superagent';

export async function getArticles (apiKey) {
  const response = await superagent
    .get('https://dev.to/api/articles/me/all')
    .set('api-key', apiKey);
  return response.body;
}

export function createArticle (apiKey, articleBody) {
  return superagent
    .post('https://dev.to/api/articles')
    .set('api-key', apiKey)
    .send(articleBody);
}

export function updateArticle (apiKey, articleBody, articleId) {
  return superagent
    .put(`https://dev.to/api/articles/${articleId}`)
    .set('api-key', apiKey)
    .send(articleBody);
}


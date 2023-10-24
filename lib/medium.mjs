import fs from 'fs';
import crypto from 'crypto';

const MEDIUM_API_STATE_FILEPATH = './.medium-api-state.json';
const accessTokensCache = new Map();

function fetchMediumApi (accessToken, method, path, body) {
  const options = {
    method,
    headers: { 'authorization': `Bearer ${accessToken}` },
  };
  if (body != null) {
    options.body = JSON.stringify(body);
    options.headers['content-type'] = 'application/json';
  }
  return fetch(`https://api.medium.com/v1${path}`, options)
    .then(async (r) => {
      if (r.status > 400) {
        const message = await r.text();
        throw new Error(`Error ${r.status}: ${message}`);
      }
      return r.json();
    });
}

// They don't have an API to do that (lol)
// So we keep a state in a local file
export async function getArticles () {
  const remoteArticleListJson = fs.readFileSync(MEDIUM_API_STATE_FILEPATH, 'utf8');
  const remoteArticleList = JSON.parse(remoteArticleListJson);
  return remoteArticleList;
}

function updateState (remoteArticleList) {
  const remoteArticleListJson = JSON.stringify(remoteArticleList, null, 2);
  fs.writeFileSync(MEDIUM_API_STATE_FILEPATH, remoteArticleListJson);
}

async function getUserId (accessToken, userId) {

  if (!accessTokensCache.has(accessToken)) {
    const user = await fetchMediumApi(accessToken, 'get', '/me');
    accessTokensCache.set(accessToken, user.data.id);
  }

  return accessTokensCache.get(accessToken);
}

export function getChecksum (articleBody) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(articleBody))
    .digest('base64');
}

async function createMediumPost (accessToken, articleBody) {

  const userId = await getUserId(accessToken);
  const response = await fetchMediumApi(accessToken, 'post', `/users/${userId}/posts`, articleBody);

  const articleId = response.data.id;
  return { articleId };
}

export async function createArticle (accessToken, articleBody, articleBodyChecksum) {

  const { articleId } = await createMediumPost(accessToken, articleBody);
  const remoteArticleList = await getArticles();

  remoteArticleList.push({
    canonicalUrl: articleBody.canonicalUrl,
    articleBodyChecksum,
    articleId,
  });
  updateState(remoteArticleList);

  return { articleId };
}

export async function updateArticle (accessToken, articleBody, articleBodyChecksum) {

  const { articleId } = await createMediumPost(accessToken, articleBody);
  const remoteArticleList = await getArticles();

  const remoteArticle = remoteArticleList.find((a) => a.canonicalUrl === articleBody.canonicalUrl);
  remoteArticle.articleBodyChecksum = articleBodyChecksum;
  updateState(remoteArticleList);

  return { articleId };
}

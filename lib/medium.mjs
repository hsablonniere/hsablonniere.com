import fs from 'fs';
import superagent from 'superagent';
import crypto from 'crypto';

const MEDIUM_API_STATE_FILEPATH = './.medium-api-state.json';
const accessTokensCache = new Map();

// They don't have an API to do that (lol)
// So we keep a state in a local file
export async function getArticles () {
  const remoteArticleListJson = fs.readFileSync(MEDIUM_API_STATE_FILEPATH, 'utf8');
  const remoteArticleList = JSON.parse(remoteArticleListJson);
  return remoteArticleList;
}

function updateState (remoteArticleList) {
  const remoteArticleListJson = JSON.stringify(remoteArticleList, null, '  ');
  fs.writeFileSync(MEDIUM_API_STATE_FILEPATH, remoteArticleListJson);
}

async function getUserId (accessToken, userId) {

  if (!accessTokensCache.has(accessToken)) {
    const user = await superagent
      .get(`https://api.medium.com/v1/me`)
      .set('authorization', `Bearer ${accessToken}`);
    accessTokensCache.set(accessToken, user.body.data.id);
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
  const response = await superagent
    .post(`https://api.medium.com/v1/users/${userId}/posts`)
    .set('authorization', `Bearer ${accessToken}`)
    .send(articleBody);

  const articleId = response.body.data.id;
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

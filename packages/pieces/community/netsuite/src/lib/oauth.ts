import { createHmac } from 'crypto';

const SIGN_METHOD = 'HMAC-SHA256';
const OAUTH_VERSION = '1.0';

function generateNonce(): string {
  const length = 11;
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length },
    () => possible[Math.floor(Math.random() * possible.length)]
  ).join('');
}

function generateSignature(
  requestUrl: string,
  httpMethod: string,
  oauthNonce: string,
  timestamp: number,
  consumerKey: string,
  consumerSecret: string,
  tokenId: string,
  tokenSecret: string,
  queryParams?: Record<string, string | number | boolean>
): string {
  // Parse URL to get base URL and existing query params
  const parsedUrl = new URL(requestUrl);
  const baseUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;

  // Collect OAuth parameters
  const allParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: SIGN_METHOD,
    oauth_timestamp: timestamp.toString(),
    oauth_token: tokenId,
    oauth_version: OAUTH_VERSION,
  };

  // Include query parameters from URL
  parsedUrl.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // Include additional query parameters (will override URL params if same key)
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      allParams[key] = String(value);
    });
  }

  // Sort parameters by key, then by value (OAuth 1.0 spec)
  const sortedKeys = Object.keys(allParams).sort();
  const paramPairs = sortedKeys.map(
    (key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`
  );
  const paramString = paramPairs.join('&');

  const signatureBaseString = [
    httpMethod.toUpperCase(),
    encodeURIComponent(baseUrl),
    encodeURIComponent(paramString),
  ].join('&');

  const signingKey = [
    encodeURIComponent(consumerSecret),
    encodeURIComponent(tokenSecret),
  ].join('&');

  const hmac = createHmac('sha256', signingKey);
  hmac.update(signatureBaseString);
  const signature = hmac.digest('base64');

  return encodeURIComponent(signature);
}

export function createOAuthHeader(
  accountId: string,
  consumerKey: string,
  consumerSecret: string,
  tokenId: string,
  tokenSecret: string,
  requestUrl: string,
  httpMethod: string,
  queryParams?: Record<string, string | number | boolean>
): string {
  const oauthNonce = generateNonce();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(
    requestUrl,
    httpMethod,
    oauthNonce,
    timestamp,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
    queryParams
  );

  const headerParams = [
    `realm="${accountId}"`,
    `oauth_token="${tokenId}"`,
    `oauth_consumer_key="${consumerKey}"`,
    `oauth_nonce="${oauthNonce}"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_signature_method="${SIGN_METHOD}"`,
    `oauth_version="${OAUTH_VERSION}"`,
    `oauth_signature="${signature}"`,
  ].join(',');

  return `OAuth ${headerParams}`;
}

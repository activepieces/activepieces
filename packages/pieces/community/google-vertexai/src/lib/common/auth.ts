import { JWT } from 'google-auth-library';
import { Store, StoreScope } from '@activepieces/pieces-framework';

export type TokenCacheEntry = {
  accessToken: string;
  expiresAt: number;
};

export type AccessTokenResult = {
  accessToken: string;
  projectId: string;
};

const TOKEN_BUFFER_MS = 60_000;

export async function getCachedAccessToken(
  serviceAccountJson: string,
  store: Store
): Promise<AccessTokenResult> {
  const credentials = JSON.parse(serviceAccountJson);
  const projectId: string = credentials.project_id;

  const cacheKey = `vertex_ai_token_${projectId}`;

  const cachedJson = await store.get<string>(cacheKey, StoreScope.PROJECT);
  if (cachedJson) {
    const cached: TokenCacheEntry = JSON.parse(cachedJson);
    if (cached.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
      return { accessToken: cached.accessToken, projectId };
    }
  }

  const jwtClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const tokenCredentials = await jwtClient.authorize();

  const accessToken = tokenCredentials.access_token;
  if (!accessToken) {
    throw new Error('Failed to obtain access token from service account');
  }

  const expiresAt = tokenCredentials.expiry_date ?? Date.now() + 3_600_000;

  await store.put(
    cacheKey,
    JSON.stringify({ accessToken, expiresAt } satisfies TokenCacheEntry),
    StoreScope.PROJECT
  );

  return { accessToken, projectId };
}

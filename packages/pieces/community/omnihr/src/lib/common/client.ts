import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';

export type OmniHrAuth = {
  props: {
    username: string;
    password: string;
    origin: string;
  };
};

type TokenPair = { access: string; refresh: string };

// Scoped per credential so two OmniHR connections in the same flow don't stomp each other.
function tokenStoreKey(auth: OmniHrAuth): string {
  return `omnihr_token_pair__${auth.props.username}__${auth.props.origin}`;
}

async function fetchTokenPair(auth: OmniHrAuth): Promise<TokenPair> {
  const response = await httpClient.sendRequest<TokenPair>({
    method: HttpMethod.POST,
    url: 'https://api.omnihr.co/api/v1/auth/token/',
    headers: {
      'Content-Type': 'application/json',
      Origin: auth.props.origin,
    },
    body: {
      username: auth.props.username,
      password: auth.props.password,
    },
  });
  return response.body;
}

async function refreshAccessToken(
  auth: OmniHrAuth,
  storedPair: TokenPair
): Promise<TokenPair> {
  const response = await httpClient.sendRequest<{ access: string; refresh?: string }>({
    method: HttpMethod.POST,
    url: 'https://api.omnihr.co/api/v1/auth/token/refresh/',
    headers: {
      'Content-Type': 'application/json',
      Origin: auth.props.origin,
    },
    body: { refresh: storedPair.refresh },
  });
  return {
    access: response.body.access,
    // Keep the existing refresh token if the endpoint doesn't rotate it.
    refresh: response.body.refresh ?? storedPair.refresh,
  };
}

async function resolveAccessToken(
  auth: OmniHrAuth,
  store?: Store
): Promise<string> {
  if (!store) {
    return (await fetchTokenPair(auth)).access;
  }

  const storeKey = tokenStoreKey(auth);
  const stored = await store.get<TokenPair>(storeKey);

  if (stored?.refresh) {
    try {
      const newPair = await refreshAccessToken(auth, stored);
      await store.put(storeKey, newPair);
      return newPair.access;
    } catch {
      // Refresh token expired or invalid — fall through to full credential login.
    }
  }

  const newPair = await fetchTokenPair(auth);
  await store.put(storeKey, newPair);
  return newPair.access;
}

export async function getAccessToken(auth: OmniHrAuth): Promise<string> {
  return (await fetchTokenPair(auth)).access;
}

export async function getAuthHeaders(
  auth: OmniHrAuth,
  store?: Store
): Promise<Record<string, string>> {
  const accessToken = await resolveAccessToken(auth, store);
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Origin: auth.props.origin,
  };
}

import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';

import { BASE_URL } from './common/base-url';

const description = `
Click **Connect** below to authorize Activepieces to access your SimplyPrint account. The connection refreshes automatically. Revoke any time from **SimplyPrint → Panel → Settings → Connected apps**.
`;

export const simplyprintAuth = PieceAuth.OAuth2({
  required: true,
  description,
  // The MCP Dynamic Client Registration flow lives at `/oauth/authorize` and
  // `/oauth/token` (different client registry); integration clients use these
  // pre-registered endpoints instead.
  authUrl: `${BASE_URL.panel}/panel/oauth2/authorize`,
  tokenUrl: `${BASE_URL.api}/0/oauth2/Token`,
  scope: [
    'user.read',
    'printers.read',
    'printers.write',
    'printers.actions',
    'queue.read',
    'queue.write',
    'files.read',
    'files.write',
    'files.temp_upload',
    'spools.read',
    'spools.write',
    'print_history.read',
    'statistics.read',
    'custom_fields.read',
    'tags.read',
    'webhooks.read',
    'webhooks.write',
  ],
});

// Bounded LRU. Without the cap, every OAuth-token rotation leaves an orphan
// entry, leaking memory proportional to lifetime token rotations on shared
// AP instances. Map iteration order is insertion order, so we evict the
// oldest by deleting the first key once the size cap is exceeded.
const SESSION_CACHE_MAX = 256;
const sessionCache = new Map<string, CurrentSession>();

function sessionCacheGet(key: string): CurrentSession | undefined {
  const v = sessionCache.get(key);
  if (v !== undefined) {
    sessionCache.delete(key);
    sessionCache.set(key, v);
  }
  return v;
}

function sessionCacheSet(key: string, value: CurrentSession): void {
  if (sessionCache.has(key)) sessionCache.delete(key);
  sessionCache.set(key, value);
  while (sessionCache.size > SESSION_CACHE_MAX) {
    const oldestKey = sessionCache.keys().next().value;
    if (oldestKey === undefined) break;
    sessionCache.delete(oldestKey);
  }
}

function authHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return { Authorization: `Bearer ${auth.access_token}` };
}

function cacheKey(auth: OAuth2PropertyValue): string {
  return `o:${auth.access_token}`;
}

// The OAuth grant binds the token to a single company, so one /GetUser fetch
// is enough to discover which company every subsequent call should target.
async function resolveSession(auth: OAuth2PropertyValue): Promise<CurrentSession> {
  const key = cacheKey(auth);
  const cached = sessionCacheGet(key);
  if (cached) return cached;

  const res = await httpClient.sendRequest<{
    status: boolean;
    user: CurrentSession['user'];
    company?: CurrentSession['company'];
  }>({
    method: HttpMethod.GET,
    url: `${BASE_URL.api}/0/account/GetUser`,
    headers: authHeaders(auth),
  });

  if (!res.body?.status) {
    throw new Error('SimplyPrint rejected the connection — reconnect your account.');
  }
  if (!res.body.company) {
    throw new Error('SimplyPrint OAuth token is not bound to a company.');
  }

  const session: CurrentSession = { user: res.body.user, company: res.body.company };
  sessionCacheSet(key, session);
  return session;
}

async function resolveCall(
  auth: OAuth2PropertyValue,
): Promise<{ headers: Record<string, string>; companyId: number }> {
  const session = await resolveSession(auth);
  return { headers: authHeaders(auth), companyId: session.company.id };
}

function getAuthHeaders(auth: OAuth2PropertyValue): Record<string, string> {
  return authHeaders(auth);
}

export const simplyprintSession = {
  resolveSession,
  resolveCall,
  getAuthHeaders,
};

export type CurrentSession = {
  user: { id: number; name: string; email: string };
  company: { id: number; name?: string };
};

import { tryCatch } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

import type { MicrosoftTeamsAuthValue, MicrosoftTeamsGraphError, MicrosoftTeamsPage } from './types';

function graphUrl({ auth }: { auth: MicrosoftTeamsAuthValue }): string {
  const host = auth.props?.cloud ?? COMMERCIAL_LOGIN_HOST;
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}

function baseUrl({ auth }: { auth: MicrosoftTeamsAuthValue }): string {
  return `${graphUrl({ auth })}/v1.0/teams`;
}

function create({ auth }: { auth: MicrosoftTeamsAuthValue }): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => Promise.resolve(auth.access_token),
    },
    baseUrl: graphUrl({ auth }),
  });
}

async function withRetry<T>(requestFn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let delayMs = INITIAL_DELAY_MS;

  while (attempt <= MAX_RETRIES) {
    try {
      return await requestFn();
    } catch (e) {
      const error: MicrosoftTeamsGraphError = typeof e === 'object' && e !== null ? e : {};
      const status = extractStatusCode({ error });
      const code = error.body?.error?.code ?? error.error?.code ?? error.code;
      if (attempt < MAX_RETRIES && shouldRetry({ statusCode: status, code })) {
        const retryAfterMs = parseRetryAfterMs({ error });
        await delay({ ms: Math.min(retryAfterMs ?? delayMs, MAX_DELAY_MS) });
        attempt++;
        if (!retryAfterMs) {
          delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
        }
        continue;
      }
      throw new Error(buildGraphErrorMessage({ error }));
    }
  }
  throw new Error('Unexpected error occured');
}

async function paginate<T>({
  auth,
  path,
  pageSize,
  maxItems,
  expand,
}: {
  auth: MicrosoftTeamsAuthValue;
  path: string;
  pageSize?: number;
  maxItems: number;
  expand?: string;
}): Promise<{ items: T[]; error: Error | null }> {
  const client = create({ auth });
  const items: T[] = [];
  const { error } = await tryCatch(async () => {
    let firstRequest = client.api(path);
    if (pageSize !== undefined) firstRequest = firstRequest.top(pageSize);
    if (expand) firstRequest = firstRequest.expand(expand);
    let response: MicrosoftTeamsPage<T> = await withRetry(() => firstRequest.get());
    while (response.value && response.value.length > 0) {
      for (const item of response.value) {
        items.push(item);
        if (items.length >= maxItems) break;
      }
      if (items.length >= maxItems) break;
      const nextLink = response['@odata.nextLink'];
      if (!nextLink) break;
      response = await withRetry(() => client.api(nextLink).get());
    }
  });
  return { items, error };
}

async function delay({ ms }: { ms: number }): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs({ error }: { error: MicrosoftTeamsGraphError }): number | null {
  const headers = error.headers ?? error.response?.headers ?? undefined;
  const retryAfter = headers?.['Retry-After'] ?? headers?.['retry-after'];
  if (!retryAfter) return null;
  const asNumber = Number(retryAfter);
  if (!Number.isNaN(asNumber)) return asNumber * 1000;
  const retryDate = Date.parse(retryAfter);
  if (!Number.isNaN(retryDate)) {
    return Math.max(0, retryDate - Date.now());
  }
  return null;
}

function extractStatusCode({ error }: { error: MicrosoftTeamsGraphError }): number {
  return (
    error.statusCode ??
    error.status ??
    error.response?.status ??
    error.response?.statusCode ??
    0
  );
}

function shouldRetry({ statusCode, code }: { statusCode: number; code?: string }): boolean {
  if (statusCode === 429 || statusCode === 503 || statusCode === 504) return true;
  if (statusCode >= 500 && statusCode < 600) return true;
  if (code && /too\s*many\s*requests/i.test(code)) return true;
  return false;
}

function buildGraphErrorMessage({ error }: { error: MicrosoftTeamsGraphError }): string {
  const status = extractStatusCode({ error });
  const err = error.body?.error ?? error.error ?? {};
  const code = err.code ?? error.code;
  const message = err.message ?? error.message ?? 'Request failed';
  const inner = err.innerError ?? err.innererror ?? {};
  const requestId = inner['request-id'] ?? inner.requestId ?? error.requestId;
  return `Graph error (${status}${code ? ` ${code}` : ''})${requestId ? ` [request-id: ${requestId}]` : ''}: ${message}`;
}

export const microsoftTeamsClient = { graphUrl, baseUrl, create, withRetry, paginate };

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  'login.microsoftonline.us': 'https://graph.microsoft.us',
};

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

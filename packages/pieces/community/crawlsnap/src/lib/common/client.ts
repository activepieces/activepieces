import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { DEFAULT_BASE_URL } from './auth';

export interface CrawlsnapAuthValue {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Custom-auth values are flat (`{ apiKey, baseUrl }`) at runtime — the same
 * shape `validate()` receives. Some published `@activepieces/pieces-framework`
 * typings additionally model the value inside `run` as a connection wrapper
 * (`{ type, props }`), so we resolve both shapes defensively.
 */
function resolveAuth(auth: unknown): CrawlsnapAuthValue {
  const raw = auth as { props?: CrawlsnapAuthValue } & CrawlsnapAuthValue;
  const flat = raw?.props ?? raw;
  return { apiKey: flat.apiKey, baseUrl: flat.baseUrl };
}

/**
 * Performs a GET against the CrawlSnap public API and unwraps the standard
 * response envelope (`{ data, is_success, ... }`) down to `data`, mirroring the
 * n8n node's `rootProperty: data` behaviour. Empty query params are dropped.
 */
export async function crawlsnapGet(
  auth: unknown,
  path: string,
  query: Record<string, string | undefined>,
): Promise<unknown> {
  const { apiKey, baseUrl } = resolveAuth(auth);

  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') {
      queryParams[key] = value;
    }
  }

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${baseUrl || DEFAULT_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    queryParams,
  });

  const body = response.body as { data?: unknown } | undefined;
  return body?.data ?? body;
}

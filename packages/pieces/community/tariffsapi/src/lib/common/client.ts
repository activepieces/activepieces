import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';

export const TARIFFSAPI_BASE_URL = 'https://tariffsapi.com/api/v1';

function cleanQuery(query: Record<string, string | boolean | undefined>): QueryParams {
  const out: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      out[key] = String(value);
    }
  }
  return out;
}

export async function tariffsApiGet(
  apiKey: string,
  path: string,
  query: Record<string, string | boolean | undefined> = {}
): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${TARIFFSAPI_BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    queryParams: cleanQuery(query),
  });
  return response.body;
}

export function apiKeyOf(auth: unknown): string {
  if (typeof auth === 'string') {
    return auth.trim();
  }
  if (typeof auth === 'object' && auth !== null && 'secret_text' in auth) {
    return String(auth.secret_text ?? '').trim();
  }
  return '';
}

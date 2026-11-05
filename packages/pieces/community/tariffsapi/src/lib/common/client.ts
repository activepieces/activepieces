import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';

export async function tariffsApiGet({
  apiKey,
  path,
  query = {},
}: {
  apiKey: string;
  path: string;
  query?: Record<string, string | boolean | undefined>;
}): Promise<unknown> {
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
    const secret = auth.secret_text;
    return typeof secret === 'string' ? secret.trim() : '';
  }
  return '';
}

export function assertTariffsApiUrl({ propsValue }: { propsValue: Record<string, unknown> }): void {
  const url = readCustomApiUrl(propsValue);
  if (url === '') {
    return;
  }
  const path = url.split('?')[0] ?? '';
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
  if (!isAbsolute) {
    if (path.includes('..') || path.includes('\\') || path.includes('@')) {
      throw new Error('The URL must be a path on the Tariffs API, such as /tariffs/resolve.');
    }
    return;
  }
  if (!url.startsWith(`${TARIFFSAPI_BASE_URL}/`) && url !== TARIFFSAPI_BASE_URL) {
    throw new Error(
      `Custom API Call only sends your Tariffs API key to ${TARIFFSAPI_BASE_URL}. Use a path such as /tariffs/resolve.`
    );
  }
  const rest = url.slice(TARIFFSAPI_BASE_URL.length).split('?')[0] ?? '';
  if (rest.includes('..') || rest.includes('\\') || rest.includes('@')) {
    throw new Error('The URL must be a path on the Tariffs API, such as /tariffs/resolve.');
  }
}

function cleanQuery(query: Record<string, string | boolean | undefined>): QueryParams {
  const out: QueryParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      out[key] = String(value);
    }
  }
  return out;
}

function readCustomApiUrl(propsValue: Record<string, unknown>): string {
  const urlProp = propsValue['url'];
  if (typeof urlProp === 'object' && urlProp !== null && 'url' in urlProp && typeof urlProp.url === 'string') {
    return urlProp.url.trim();
  }
  return '';
}

export const TARIFFSAPI_BASE_URL = 'https://tariffsapi.com/api/v1';

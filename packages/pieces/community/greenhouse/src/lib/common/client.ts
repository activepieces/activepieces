import {
  AuthenticationType,
  HttpHeaders,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const GREENHOUSE_BASE_URL = 'https://harvest.greenhouse.io/v1';

export type GreenhouseBasicAuth = {
  username: string;
  password?: string;
};

type GreenhouseRequestParams = {
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
  onBehalfOfUserId?: string | number;
  headers?: HttpHeaders;
};

export async function makeRequest<T>(
  auth: GreenhouseBasicAuth,
  params: GreenhouseRequestParams,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: params.method,
    url: `${GREENHOUSE_BASE_URL}${params.path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password ?? '',
    },
    queryParams: params.queryParams,
    body: params.body,
    headers: compactHeaders({
      Accept: 'application/json',
      ...(params.body ? { 'Content-Type': 'application/json' } : {}),
      ...(params.onBehalfOfUserId
        ? { 'On-Behalf-Of': String(params.onBehalfOfUserId) }
        : {}),
      ...params.headers,
    }),
  });

  return response.body;
}

export function compactObject<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === '') {
        return false;
      }

      if (Array.isArray(entry) && entry.length === 0) {
        return false;
      }

      return true;
    }),
  );
}

function compactHeaders(headers: HttpHeaders): HttpHeaders {
  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => value !== undefined && value !== ''),
  );
}

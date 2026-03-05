import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { KnowBe4Auth, KNOWBE4_REGIONS } from '../auth';

export function getBaseUrl(auth: KnowBe4Auth): string {
  return KNOWBE4_REGIONS[auth.region] ?? KNOWBE4_REGIONS['us'];
}

export async function knowbe4ApiRequest<T>(params: {
  auth: KnowBe4Auth;
  method: HttpMethod;
  endpoint: string;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const baseUrl = getBaseUrl(params.auth);
  const request: HttpRequest = {
    method: params.method,
    url: `${baseUrl}/v1${params.endpoint}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: params.auth.apiKey,
    },
    queryParams: params.queryParams,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function knowbe4PaginatedRequest<T>(params: {
  auth: KnowBe4Auth;
  endpoint: string;
  queryParams?: Record<string, string>;
  perPage?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const perPage = params.perPage ?? 100;

  while (true) {
    const items = await knowbe4ApiRequest<T[]>({
      auth: params.auth,
      method: HttpMethod.GET,
      endpoint: params.endpoint,
      queryParams: {
        ...params.queryParams,
        page: String(page),
        per_page: String(perPage),
      },
    });

    results.push(...items);

    if (items.length < perPage) {
      break;
    }
    page++;
  }

  return results;
}

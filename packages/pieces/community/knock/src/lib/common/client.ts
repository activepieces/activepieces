import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { KNOCK_API_BASE_URL, knockHeaders } from '../auth';

interface KnockApiCallParams {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

export async function knockApiCall(params: KnockApiCallParams): Promise<unknown> {
  const { apiKey, method, path, body, query } = params;

  const url = new URL(`${KNOCK_API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v);
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: url.toString(),
    headers: knockHeaders(apiKey),
    body: body ?? undefined,
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

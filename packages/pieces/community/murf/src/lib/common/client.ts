import {
  HttpMethod,
  httpClient,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const MURF_API_URL = 'https://api.murf.ai/v1';

export type MurfApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function murfApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  query,
  body,
}: MurfApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${MURF_API_URL}${endpoint}`,
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    queryParams: qs,
    body,
  });

  return response.body;
}

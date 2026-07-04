import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.detecting-ai.com';

export const detectingAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'You can obtain your API key from the [DETECTING-AI.COM Dashboard](https://detecting-ai.com) in the API section.',
  required: true,
});

export type DetectingAiApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function detectingAiApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  query,
  body,
}: DetectingAiApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'X-API-Key': apiKey,
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

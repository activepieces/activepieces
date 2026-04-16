import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const ENGAGEBAY_API_BASE_URL = 'https://api.engagebay.com';

type EngagebayRequestParams = {
  apiKey: string;
  path: string;
  method?: HttpMethod;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
};

export async function engagebayRequest<TResponse>({
  apiKey,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: EngagebayRequestParams): Promise<TResponse> {
  const response = await httpClient.sendRequest<TResponse>({
    method,
    url: `${ENGAGEBAY_API_BASE_URL}${path}`,
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}

import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.serpstat.com/v4';

export interface SerpstatApiCallProps {
  apiToken: string;
  method: HttpMethod;
  resourceUri: string;
  queryParams?: Record<string, any>;
  body?: any;
}

export const serpstatApiCall = async ({
  apiToken,
  method,
  resourceUri,
  queryParams,
  body,
}: SerpstatApiCallProps) => {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}; 
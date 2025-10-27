import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from '@activepieces/pieces-common';
import { BASE_URL } from './auth';

export interface FolkApiCallParams {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export const folkApiCall = async <T = any>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: FolkApiCallParams): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const request: HttpRequest = {
    method,
    url,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    queryParams,
  };

  if (body) {
    request.body = body;
  }

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
};


import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.timeops.dk/api/v1';

export const timeOpsClient = {
  async makeRequest<T>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'x-api-key': auth,
      },
      body,
    });
    return response.body;
  },
};

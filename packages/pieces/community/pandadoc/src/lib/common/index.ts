import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pandadoc.com/public/v1';

export const pandadocClient = {
  async makeRequest<T = any>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        Authorization: `API-Key ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.body;
  },

  async makeFileRequest(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    file?: any
  ): Promise<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        Authorization: `API-Key ${auth}`,
      },
      body: formData,
    });

    return response.body;
  },
};

export * from './auth';

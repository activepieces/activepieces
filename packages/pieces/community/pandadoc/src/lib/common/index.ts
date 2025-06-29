import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PandaDocAuthType } from './auth';

const BASE_URL = 'https://api.pandadoc.com/public/v1';

export const pandadocClient = {
  async makeRequest<T = any>(
    auth: PandaDocAuthType,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        Authorization: `API-Key ${auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return response.body;
  },

  async makeFileRequest(
    auth: PandaDocAuthType,
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
        Authorization: `API-Key ${auth.apiKey}`,
      },
      body: formData,
    });

    return response.body;
  },
};

export * from './auth';
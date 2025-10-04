import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const chatDataCommon = {
  baseUrl: 'https://api.chat-data.com/api/v2',
  
  baseHeaders: (apiKey: string) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }),

  async makeRequest<T = any>({
    apiKey,
    method = HttpMethod.GET,
    endpoint,
    body,
    queryParams,
  }: {
    apiKey: string;
    method?: HttpMethod;
    endpoint: string;
    body?: any;
    queryParams?: Record<string, any>;
  }) {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: this.baseHeaders(apiKey),
      body,
      queryParams,
    });
    
    return response.body;
  },
};
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const assembledCommon = {
  baseUrl: 'https://api.assembledhq.com/v0',
  
  async makeRequest(
    auth: string, 
    method: HttpMethod, 
    endpoint: string, 
    body?: unknown,
    headers?: Record<string, string>
  ) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    return await httpClient.sendRequest({
      method,
      url,
      headers: {
        'Authorization': `Basic ${Buffer.from(auth + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });
  },

  formatDateTime(date: string | Date): string {
    return new Date(date).toISOString();
  },

  formatDate(date: string | Date): string {
    return new Date(date).toISOString().split('T')[0];
  },

  makeClient(auth: string) {
    return {
      rawRequest: async (query: string, variables?: Record<string, unknown>) => {
        const response = await this.makeRequest(
          auth,
          HttpMethod.POST,
          '/graphql',
          { query, variables }
        );
        return response.body;
      }
    };
  }
};
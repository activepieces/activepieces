import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

export interface MurfAuth {
  auth: string;
}

export const murfCommon = {
  async apiCall({
    auth,
    method,
    resourceUri,
    body,
    headers = {},
  }: {
    auth: string;
    method: HttpMethod;
    resourceUri: string;
    body?: any;
    headers?: Record<string, string>;
  }) {
    const url = `https://api.murf.ai${resourceUri}`;

    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const requestConfig = {
      method,
      url,
      headers: requestHeaders,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      } as const,
      body,
    };

    return await httpClient.sendRequest(requestConfig);
  },

  async apiCallWithApiKey({
    apiKey,
    method,
    resourceUri,
    body,
    headers = {},
  }: {
    apiKey: string;
    method: HttpMethod;
    resourceUri: string;
    body?: any;
    headers?: Record<string, string>;
  }) {
    const url = `https://api.murf.ai${resourceUri}`;

    const requestHeaders = {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      ...headers,
    };

    const requestConfig = {
      method,
      url,
      headers: requestHeaders,
      body,
    };

    return await httpClient.sendRequest(requestConfig);
  },

  async getToken(apiKey: string): Promise<string | null> {
    try {
      const response = await this.apiCallWithApiKey({
        apiKey,
        method: HttpMethod.GET,
        resourceUri: '/v1/auth/token',
      });
      return response.body?.token || null;
    } catch (error) {
      return null;
    }
  },

  async apiCallWithToken({
    apiKey,
    method,
    resourceUri,
    body,
    headers = {},
  }: {
    apiKey: string;
    method: HttpMethod;
    resourceUri: string;
    body?: any;
    headers?: Record<string, string>;
  }) {
    const token = await this.getToken(apiKey);
    
    if (token) {
      return this.apiCall({
        auth: token,
        method,
        resourceUri,
        body,
        headers,
      });
    } else {
      return this.apiCallWithApiKey({
        apiKey,
        method,
        resourceUri,
        body,
        headers,
      });
    }
  },
};

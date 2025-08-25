import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const retellAiApi = {
  baseUrl: 'https://api.retellai.com',
  
  async call<T = any>(
    method: HttpMethod,
    endpoint: string,
    auth: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await httpClient.sendRequest<T>({
      method,
      url: url.toString(),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },

  async get<T = any>(endpoint: string, auth: string, queryParams?: Record<string, string>): Promise<T> {
    return this.call<T>(HttpMethod.GET, endpoint, auth, undefined, queryParams);
  },

  async post<T = any>(endpoint: string, auth: string, body?: any): Promise<T> {
    return this.call<T>(HttpMethod.POST, endpoint, auth, body);
  },

  async patch<T = any>(endpoint: string, auth: string, body?: any): Promise<T> {
    return this.call<T>(HttpMethod.PATCH, endpoint, auth, body);
  },

  async delete<T = any>(endpoint: string, auth: string): Promise<T> {
    return this.call<T>(HttpMethod.DELETE, endpoint, auth);
  },
};

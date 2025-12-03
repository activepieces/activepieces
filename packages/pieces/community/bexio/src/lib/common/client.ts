import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { bexioCommon } from './index';

export class BexioClient {
  constructor(private auth: {access_token: string}) {}

  async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    queryParams?: Record<string, string>
  ): Promise<T> {
    // If endpoint already includes version (starts with /2.0/ or /3.0/), use it directly
    // Otherwise, prepend the default API version
    const url = endpoint.startsWith('/2.0/') || endpoint.startsWith('/3.0/')
      ? `${bexioCommon.baseUrl}${endpoint}`
      : `${bexioCommon.baseUrl}/${bexioCommon.api_version}${endpoint}`;

    const request: HttpRequest = {
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.auth.access_token,
      },
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      request.body = data;
    }

    if (queryParams) {
      request.queryParams = queryParams;
    }

    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  }

  async get<T>(endpoint: string, queryParams?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(HttpMethod.GET, endpoint, undefined, queryParams);
  }

  async post<T>(endpoint: string, data: unknown, queryParams?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>(HttpMethod.POST, endpoint, data, queryParams);
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.makeRequest<T>(HttpMethod.PATCH, endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(HttpMethod.DELETE, endpoint);
  }
}


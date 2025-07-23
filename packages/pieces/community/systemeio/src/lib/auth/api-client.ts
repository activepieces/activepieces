import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export class SystemeioApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.systeme.io/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async request<T = any>(options: {
    method: HttpMethod;
    path: string;
    queryParams?: Record<string, any>;
    body?: any;
    contentType?: string;
  }): Promise<T> {
    const res = await httpClient.sendRequest({
      method: options.method,
      url: `${this.baseUrl}${options.path}`,
      headers: {
        'X-API-Key': this.apiKey,
        ...(options.contentType ? { 'Content-Type': options.contentType } : {}),
      },
      queryParams: options.queryParams,
      body: options.body,
    });
    if (res.status === 429) {
      throw new Error(`Rate limit exceeded. Retry after ${res.headers['Retry-After']} seconds.`);
    }
    if (res.status === 401) {
      throw new Error('Invalid API Key. Please check your Systeme.io API Key in the dashboard.');
    }
    // Optionally, log rate limit headers for debugging
    // console.log('X-RateLimit-Remaining:', res.headers['X-RateLimit-Remaining']);
    // console.log('X-RateLimit-Refill:', res.headers['X-RateLimit-Refill']);
    return res.body;
  }
} 
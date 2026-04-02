import { HttpMethod, httpClient } from '@activepieces/pieces-common';

type OutsetaAuth = {
  domain: string;
  apiKey: string;
  apiSecret: string;
};

export class OutsetaClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(auth: OutsetaAuth) {
    // Remove trailing slash if present
    this.baseUrl = auth.domain.replace(/\/$/, '');
    // Outseta Admin API auth format
    this.authHeader = `Outseta ${auth.apiKey}:${auth.apiSecret}`;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: body as any,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Outseta API error (${response.status}): ${JSON.stringify(response.body)}`
      );
    }

    return response.body as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(HttpMethod.GET, path);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(HttpMethod.PUT, path, body);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(HttpMethod.POST, path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(HttpMethod.DELETE, path);
  }

  static escapeOData(value: string): string {
    return encodeURIComponent(value.replace(/'/g, "''"));
  }

  async getAllPages<T>(basePath: string, pageSize = 100): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;

    while (true) {
      const separator = basePath.includes('?') ? '&' : '?';
      const res = await this.get<any>(
        `${basePath}${separator}$top=${pageSize}&$skip=${offset}`
      );
      const items: T[] = res?.items ?? res?.Items ?? [];
      allItems.push(...items);

      if (items.length < pageSize) break;
      offset += pageSize;
    }

    return allItems;
  }
}

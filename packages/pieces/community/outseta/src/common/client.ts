import {
  HttpMessageBody,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export class OutsetaClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(auth: OutsetaAuth) {
    this.baseUrl = auth.domain.replace(/\/$/, '');
    this.authHeader = `Outseta ${auth.apiKey}:${auth.apiSecret}`;
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

  async getAllPages<T>(basePath: string, pageSize = 100): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;

    while (true) {
      const separator = basePath.includes('?') ? '&' : '?';
      const res = await this.get<PaginatedResponse<T>>(
        `${basePath}${separator}$top=${pageSize}&$skip=${offset}`
      );
      const items: T[] = res?.items ?? res?.Items ?? [];
      allItems.push(...items);

      if (items.length < pageSize) break;
      offset += pageSize;
    }

    return allItems;
  }

  static escapeOData(value: string): string {
    const odataEscaped = value.replace(/'/g, "''");
    // `+` is intentionally NOT in the safe set: some URL parsers decode it
    // as space, which would silently corrupt tagged emails like
    // `user+tag@example.com`. Encoding to %2B is unambiguous.
    return odataEscaped.replace(
      /[^A-Za-z0-9@:._\-~!$()*]/g,
      (c) => encodeURIComponent(c)
    );
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
      body: body as HttpMessageBody,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Outseta API error (${response.status}): ${JSON.stringify(response.body)}`
      );
    }

    return response.body as T;
  }
}

type OutsetaAuth = {
  domain: string;
  apiKey: string;
  apiSecret: string;
};

type PaginatedResponse<T> = {
  items?: T[];
  Items?: T[];
};

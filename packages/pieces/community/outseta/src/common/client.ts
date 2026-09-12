import { isNil } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { OutsetaPage } from './outseta-types';

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

  async getPage<T>(path: string): Promise<PagedResult<T>> {
    const response = await this.get<OutsetaPage<T>>(path);
    return {
      items: response?.items ?? response?.Items ?? [],
      total: response?.metadata?.total ?? null,
      limit: response?.metadata?.limit ?? null,
      offset: response?.metadata?.offset ?? null,
    };
  }

  async getAllPages<T>(basePath: string, requestedPageSize = 100): Promise<T[]> {
    const collected: T[] = [];
    let page = 0;
    let appliedPageSize = requestedPageSize;

    for (;;) {
      const separator = basePath.includes('?') ? '&' : '?';
      const result = await this.getPage<T>(
        `${basePath}${separator}limit=${requestedPageSize}&offset=${page}`
      );
      collected.push(...result.items);

      if (!isNil(result.limit) && result.limit > 0) {
        appliedPageSize = result.limit;
      }

      const reachedTotal =
        !isNil(result.total) && collected.length >= result.total;

      if (
        result.items.length === 0 ||
        result.items.length < appliedPageSize ||
        reachedTotal
      ) {
        break;
      }
      page += 1;
    }

    return collected;
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
      body,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Outseta API error (${response.status}): ${JSON.stringify(response.body)}`
      );
    }

    return response.body;
  }
}

type OutsetaAuth = {
  domain: string;
  apiKey: string;
  apiSecret: string;
};

type PagedResult<T> = {
  items: T[];
  total: number | null;
  limit: number | null;
  offset: number | null;
};

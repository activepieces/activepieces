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
    // Outseta's `offset` is PAGE-BASED, not item-based.
    // Verified against the live API on /crm/people (total=182):
    //   limit=100 offset=0 → 100 items (items 0-99)
    //   limit=100 offset=1 → 82 items  (items 100-181)
    //   limit=100 offset=2 → 0 items   (past end)
    //   limit=50  offset=3 → 32 items  (items 150-181)
    //   limit=25  offset=7 → 7 items   (items 175-181)
    // Increment by 1 per iteration, not by pageSize.
    let page = 0;

    while (true) {
      const separator = basePath.includes('?') ? '&' : '?';
      const res = await this.get<PaginatedResponse<T>>(
        `${basePath}${separator}limit=${pageSize}&offset=${page}`
      );
      const items: T[] = res?.items ?? res?.Items ?? [];
      allItems.push(...items);

      if (items.length < pageSize) break;
      page += 1;
    }

    return allItems;
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

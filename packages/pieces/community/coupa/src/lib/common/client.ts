import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { formatCoupaError, normalizeInstanceUrl } from './utils';

export type CoupaAuthProps = {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
};

const COUPA_PAGE_LIMIT = 50;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export class CoupaClient {
  private readonly baseUrl: string;
  private readonly tokenUrl: string;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private tokenPromise: Promise<string> | null = null;

  constructor(private readonly auth: CoupaAuthProps) {
    const host = normalizeInstanceUrl(this.auth.instanceUrl);
    this.baseUrl = `https://${host}/api`;
    this.tokenUrl = `https://${host}/oauth2/token`;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    // Reuse a single in-flight token request so concurrent calls within the
    // same run don't each hit the token endpoint (avoids a TOCTOU race).
    if (!this.tokenPromise) {
      this.tokenPromise = this.fetchAccessToken().finally(() => {
        this.tokenPromise = null;
      });
    }
    return this.tokenPromise;
  }

  private async fetchAccessToken(): Promise<string> {
    const response = await httpClient.sendRequest<{
      access_token: string;
      expires_in: number;
    }>({
      method: HttpMethod.POST,
      url: this.tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.auth.clientId,
        client_secret: this.auth.clientSecret,
        grant_type: 'client_credentials',
        scope: this.auth.scope,
      }),
    });

    this.accessToken = response.body.access_token;
    this.tokenExpiresAt =
      Date.now() + response.body.expires_in * 1000 - TOKEN_REFRESH_BUFFER_MS;
    return this.accessToken;
  }

  async request<T extends HttpMessageBody>({
    method,
    resourceUri,
    query,
    body,
    headers,
  }: {
    method: HttpMethod;
    resourceUri: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  }): Promise<T> {
    const token = await this.getAccessToken();
    const queryParams: QueryParams = {};
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
    }

    const path = resourceUri.startsWith('/') ? resourceUri : `/${resourceUri}`;
    const request: HttpRequest = {
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      queryParams,
      body,
    };

    try {
      const response = await httpClient.sendRequest<T>(request);
      return response.body;
    } catch (error) {
      throw new Error(formatCoupaError(error));
    }
  }

  async requestMultipart<T extends HttpMessageBody>({
    resourceUri,
    formData,
  }: {
    resourceUri: string;
    formData: unknown;
  }): Promise<T> {
    const token = await this.getAccessToken();
    const path = resourceUri.startsWith('/') ? resourceUri : `/${resourceUri}`;

    try {
      const response = await httpClient.sendRequest<T>({
        method: HttpMethod.POST,
        url: `${this.baseUrl}${path}`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      return response.body;
    } catch (error) {
      throw new Error(formatCoupaError(error));
    }
  }

  async *paginateRecords(
    resource: string,
    query: Record<string, string | number | boolean | undefined> = {}
  ): AsyncGenerator<Record<string, unknown>[]> {
    let offset = 0;
    while (true) {
      const page = await this.request<Record<string, unknown>[]>({
        method: HttpMethod.GET,
        resourceUri: `/${resource}`,
        query: {
          ...query,
          limit: COUPA_PAGE_LIMIT,
          offset,
        },
      });

      if (!Array.isArray(page) || page.length === 0) {
        break;
      }

      yield page as Record<string, unknown>[];

      if (page.length < COUPA_PAGE_LIMIT) {
        break;
      }
      offset += COUPA_PAGE_LIMIT;
    }
  }

  async fetchAllRecords(
    resource: string,
    query: Record<string, string | number | boolean | undefined> = {}
  ): Promise<Record<string, unknown>[]> {
    const records: Record<string, unknown>[] = [];
    for await (const page of this.paginateRecords(resource, query)) {
      records.push(...page);
    }
    return records;
  }
}

export const COUPA_PAGE_SIZE = COUPA_PAGE_LIMIT;

import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { ExtensivCredentials, TokenResponse } from './types';

export class ExtensivApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = 'ExtensivApiError';
  }
}

export class ExtensivClient {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly credentials: ExtensivCredentials) {}

  private getAuthHeaders(): Record<string, string> {
    const encoded = Buffer.from(
      `${this.credentials.clientId}:${this.credentials.clientSecret}`,
    ).toString('base64');

    return {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    };
  }

  private async authenticate(): Promise<string> {
    const response = await httpClient.sendRequest<TokenResponse>({
      method: HttpMethod.POST,
      url: `${this.credentials.baseUrl}/AuthServer/api/Token`,
      headers: this.getAuthHeaders(),
      body: {
        grant_type: 'client_credentials',
        user_login: this.credentials.userLogin,
      },
    });

    const token = response.body.access_token;

    if (!token) {
      throw new ExtensivApiError(
        'No access token returned from Extensiv.'
      );
    }

    this.token = token;

    const ttlSeconds =
      response.body.expires_in > 0
        ? response.body.expires_in
        : 3600;

    this.tokenExpiry = new Date(
      Date.now() + ttlSeconds * 1000,
    );

    return token;
  }

  private async getToken(): Promise<string> {
    const bufferMinutes = 5;

    if (
      this.token &&
      this.tokenExpiry &&
      this.tokenExpiry.getTime() - Date.now() >
        bufferMinutes * 60 * 1000
    ) {
      return this.token;
    }

    return this.authenticate();
  }

  
  private async apiRequest<T>(params: {
    method: HttpMethod;
    url: string;
    body?: unknown;
    queryParams?: QueryParams;
    headers?: Record<string, string>;
  }): Promise<T> {
    const token = await this.getToken();

    const response = await httpClient.sendRequest<T>({
      method: params.method,
      url: `${this.credentials.baseUrl}${params.url}`,
      body: params.body,
      queryParams: params.queryParams,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/hal+json',
        ...params.headers,
      },
    });

    return response.body;
  }

  async getOrders(params: QueryParams = {}) {
    return this.apiRequest({
      method: HttpMethod.GET,
      url: '/orders',
      queryParams: params,
    });
  }

  // Create order
  async createOrder(order: Record<string, unknown>) {
    return this.apiRequest({
      method: HttpMethod.POST,
      url: '/orders',
      body: order,
    });
  }

  // Get customers
  async getCustomers(params: QueryParams = {}) {
    return this.apiRequest({
      method: HttpMethod.GET,
      url: '/customers',
      queryParams: params,
    }); 
  }

  // Get items
  async getItems(
      customerId: number,
      params: QueryParams = {},
    ) {
      return this.apiRequest({
        method: HttpMethod.GET,
        url: `/customers/${customerId}/items`,
        queryParams: params,
      });
  }

  // Get stock summaries 
  async getStockSummaries(params: QueryParams = {}) {
    return this.apiRequest({
      method: HttpMethod.GET,
      url: '/inventory/stocksummaries',
      queryParams: params,
    });

    
  }
  
}


import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateWebhookRequest, CreateWebhookResponse } from './types';

export interface AircallAuth {
  apiToken: string;
  baseUrl: string;
}

export class AircallClient {
  private auth: AircallAuth;

  constructor(auth: AircallAuth) {
    this.auth = auth;
  }

  async makeRequest<T>({
    method,
    url,
    body,
    queryParams,
  }: {
    method: HttpMethod;
    url: string;
    body?: unknown;
    queryParams?: Record<string, string>;
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.auth.baseUrl}${url}`,
      headers: {
        'Authorization': `Bearer ${this.auth.apiToken}`,
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
    });

    return response.body;
  }

  async authenticate(): Promise<void> {
    await this.makeRequest({
      method: HttpMethod.GET,
      url: '/users',
    });
  }

  async createWebhook(request: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    return this.makeRequest<CreateWebhookResponse>({
      method: HttpMethod.POST,
      url: '/webhooks',
      body: request,
    });
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    await this.makeRequest({
      method: HttpMethod.DELETE,
      url: `/webhooks/${webhookId}`,
    });
  }

  async listWebhooks(): Promise<CreateWebhookResponse[]> {
    return this.makeRequest<CreateWebhookResponse[]>({
      method: HttpMethod.GET,
      url: '/webhooks',
    });
  }
}

export const makeClient = (auth: AircallAuth): AircallClient => {
  return new AircallClient(auth);
}; 
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateWebhookRequest, CreateWebhookResponse } from './types';

export interface AircallAuth {
  username: string;
  password: string;
  baseUrl: string;
}

export class AircallClient {
  private auth: AircallAuth;
  private timeout: number;
  private credentials: string;

  constructor(auth: AircallAuth, timeout = 10000) { // Reduced default timeout
    this.auth = {
      username: auth.username.trim(),
      password: auth.password.trim(),
      baseUrl: auth.baseUrl || 'https://api.aircall.io/v1',
    };
    this.timeout = timeout;
    this.credentials = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
  }

  // Simplified request method with better error handling
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
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${this.auth.baseUrl}${url}`,
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Activepieces-Aircall/1.0',
          'Accept': 'application/json',
        },
        body,
        queryParams,
        timeout: this.timeout,
      });

      return response.body;
    } catch (error) {
      // Simplified error handling
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        
        if (errorObj.response?.status) {
          const status = errorObj.response.status;
          const responseBody = errorObj.response.body;
          
          switch (status) {
            case 400:
              throw new Error(`Invalid request: ${responseBody?.message || 'Please check your parameters'}`);
            case 401:
              throw new Error('Authentication failed. Please verify your API credentials.');
            case 403:
              throw new Error('Access denied. Check your API permissions.');
            case 404:
              throw new Error('Resource not found.');
            case 429:
              throw new Error('Rate limit exceeded. Please wait before retrying.');
            case 500:
            case 502:
            case 503:
              throw new Error('Aircall API is temporarily unavailable.');
            default:
              throw new Error(`API error (${status}): ${responseBody?.message || 'Unknown error'}`);
          }
        }
        
        // Network errors
        if (errorObj.code === 'ENOTFOUND' || errorObj.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Aircall API. Check your network connection.');
        }
        
        if (errorObj.code === 'ETIMEDOUT' || errorObj.message?.includes('timeout')) {
          throw new Error('Request timeout. Please try again.');
        }
      }
      
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticate(): Promise<void> {
    await this.makeRequest({
      method: HttpMethod.GET,
      url: '/users',
    });
  }

  async createWebhook(request: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    if (!request.url || !request.events || request.events.length === 0) {
      throw new Error('Webhook URL and events are required');
    }

    return this.makeRequest<CreateWebhookResponse>({
      method: HttpMethod.POST,
      url: '/webhooks',
      body: request,
    });
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    if (!webhookId || webhookId <= 0) {
      throw new Error('Valid webhook ID is required');
    }

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

export const makeClient = (auth: AircallAuth, timeout?: number): AircallClient => {
  if (!auth.username || !auth.password) {
    throw new Error('API username and password are required');
  }
  
  return new AircallClient(auth, timeout);
};
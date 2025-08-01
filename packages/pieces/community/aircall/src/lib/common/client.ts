import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CreateWebhookRequest, CreateWebhookResponse, HttpError } from './types';

export interface AircallAuth {
  username: string;
  password: string;
  baseUrl: string;
}

export class AircallClient {
  private auth: AircallAuth;
  private timeout: number;
  private credentials: string;

  constructor(auth: AircallAuth, timeout = 12000) { // Increased default timeout
    this.auth = {
      username: auth.username.trim(),
      password: auth.password.trim(),
      baseUrl: (auth.baseUrl || 'https://api.aircall.io/v1').replace(/\/$/, ''), // Remove trailing slash
    };
    this.timeout = timeout;
    this.credentials = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
  }

  // Enhanced request method with better error handling
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
      const fullUrl = `${this.auth.baseUrl}${url}`;
      
      const response = await httpClient.sendRequest<T>({
        method,
        url: fullUrl,
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

      // Validate response
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from Aircall API');
      }

      return response.body;
    } catch (error) {
      // Enhanced error handling
      if (error && typeof error === 'object') {
        const errorObj = error as HttpError;
        
        if (errorObj.response?.status) {
          const status = errorObj.response.status;
          const responseBody = errorObj.response.body;
          
          switch (status) {
            case 400: {
              const badRequestMsg = responseBody?.message || responseBody?.error || 'Invalid request parameters';
              throw new Error(`Bad request: ${badRequestMsg}`);
            }
            case 401: {
              throw new Error('Authentication failed. Please verify your API credentials.');
            }
            case 403: {
              throw new Error('Access denied. Check your API permissions.');
            }
            case 404: {
              throw new Error('Resource not found.');
            }
            case 422: {
              const validationMsg = responseBody?.message || responseBody?.error || 'Validation failed';
              throw new Error(`Validation error: ${validationMsg}`);
            }
            case 429: {
              throw new Error('Rate limit exceeded. Please wait before retrying.');
            }
            case 500:
            case 502:
            case 503: {
              throw new Error('Aircall API is temporarily unavailable.');
            }
            default: {
              const errorMsg = responseBody?.message || responseBody?.error || 'Unknown error';
              throw new Error(`API error (${status}): ${errorMsg}`);
            }
          }
        }
        
        // Network errors
        if (errorObj.code === 'ENOTFOUND' || errorObj.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Aircall API. Check your network connection.');
        }
        
        if (errorObj.code === 'ETIMEDOUT' || errorObj.message?.includes('timeout')) {
          throw new Error('Request timeout. Please try again.');
        }

        // SSL/TLS errors
        if (errorObj.code?.includes('CERT') || errorObj.message?.includes('certificate')) {
          throw new Error('SSL certificate error. Please contact support.');
        }
      }
      
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticate(): Promise<void> {
    try {
      await this.makeRequest({
        method: HttpMethod.GET,
        url: '/users',
      });
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // Fetch real data methods
  async getContacts(params?: { limit?: number; offset?: number }): Promise<any[]> {
    const queryParams: Record<string, string> = {};
    if (params?.['limit']) queryParams['limit'] = params['limit'].toString();
    if (params?.['offset']) queryParams['offset'] = params['offset'].toString();

    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      url: '/contacts',
      queryParams,
    });
  }

  async getContact(contactId: number): Promise<any> {
    return this.makeRequest<any>({
      method: HttpMethod.GET,
      url: `/contacts/${contactId}`,
    });
  }

  async getCalls(params?: { limit?: number; offset?: number; from?: string; to?: string }): Promise<any[]> {
    const queryParams: Record<string, string> = {};
    if (params?.['limit']) queryParams['limit'] = params['limit'].toString();
    if (params?.['offset']) queryParams['offset'] = params['offset'].toString();
    if (params?.['from']) queryParams['from'] = params['from'];
    if (params?.['to']) queryParams['to'] = params['to'];

    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      url: '/calls',
      queryParams,
    });
  }

  async getCall(callId: number): Promise<any> {
    return this.makeRequest<any>({
      method: HttpMethod.GET,
      url: `/calls/${callId}`,
    });
  }

  async getNotes(callId: number): Promise<any[]> {
    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      url: `/calls/${callId}/comments`,
    });
  }

  async getNumbers(): Promise<any[]> {
    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      url: '/numbers',
    });
  }

  async getNumber(numberId: number): Promise<any> {
    return this.makeRequest<any>({
      method: HttpMethod.GET,
      url: `/numbers/${numberId}`,
    });
  }

  async getMessages(params?: { limit?: number; offset?: number }): Promise<any[]> {
    const queryParams: Record<string, string> = {};
    if (params?.['limit']) queryParams['limit'] = params['limit'].toString();
    if (params?.['offset']) queryParams['offset'] = params['offset'].toString();

    return this.makeRequest<any[]>({
      method: HttpMethod.GET,
      url: '/messages',
      queryParams,
    });
  }
}

export const makeClient = (auth: AircallAuth, timeout?: number): AircallClient => {
  if (!auth) {
    throw new Error('Authentication configuration is required');
  }
  
  if (!auth.username || !auth.password) {
    throw new Error('API username and password are required');
  }
  
  if (typeof auth.username !== 'string' || typeof auth.password !== 'string') {
    throw new Error('API username and password must be strings');
  }
  
  if (auth.username.trim().length === 0 || auth.password.trim().length === 0) {
    throw new Error('API username and password cannot be empty');
  }
  
  return new AircallClient(auth, timeout);
};
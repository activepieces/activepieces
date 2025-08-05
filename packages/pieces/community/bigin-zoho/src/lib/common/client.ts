import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { BiginZohoAuthType } from './auth';

export class BiginClient {
  constructor(private auth: BiginZohoAuthType) {}

  private getBaseUrl(): string {
    return 'https://www.zohoapis.com/bigin/v1';
  }

  async makeRequest<T = any>(
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${this.getBaseUrl()}${endpoint}`,
      headers: {
        Authorization: `Zoho-oauthtoken ${this.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      request.body = JSON.stringify(body);
    }

    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      request.url += `?${searchParams.toString()}`;
    }

    const response = await httpClient.sendRequest(request);
    return response.body;
  }

  async getUsers(type: string = 'ActiveUsers'): Promise<any> {
    return this.makeRequest(HttpMethod.GET, '/users', undefined, { type });
  }

  async getFieldsMetadata(module: string): Promise<any> {
    return this.makeRequest(HttpMethod.GET, '/settings/fields', undefined, { module });
  }

  async getModules(): Promise<any> {
    return this.makeRequest(HttpMethod.GET, '/settings/modules');
  }

  async createRecord(module: string, data: any): Promise<any> {
    const requestBody = { data: [data] };
    return this.makeRequest(HttpMethod.POST, `/${module}`, requestBody);
  }

  async updateRecord(module: string, recordId: string, data: any): Promise<any> {
    const requestBody = { data: [data] };
    return this.makeRequest(HttpMethod.PUT, `/${module}/${recordId}`, requestBody);
  }

  async searchRecords(module: string, criteria: Record<string, string>): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });
    
    return this.makeRequest(HttpMethod.GET, `/${module}/search`, undefined, Object.fromEntries(searchParams));
  }

  async getRecords(module: string, options?: {
    fields?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    perPage?: number;
    page?: number;
  }): Promise<any> {
    const queryParams: Record<string, string> = {};
    
    if (options?.fields) {
      queryParams['fields'] = options.fields.join(',');
    }
    if (options?.sortBy) {
      queryParams['sort_by'] = options.sortBy;
    }
    if (options?.sortOrder) {
      queryParams['sort_order'] = options.sortOrder;
    }
    if (options?.perPage) {
      queryParams['per_page'] = options.perPage.toString();
    }
    if (options?.page) {
      queryParams['page'] = options.page.toString();
    }

    return this.makeRequest(HttpMethod.GET, `/${module}`, undefined, queryParams);
  }
} 
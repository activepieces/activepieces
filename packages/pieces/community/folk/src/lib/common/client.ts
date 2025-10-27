import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const folkClient = {
  baseUrl: 'https://api.folk.app',

  async testConnection(apiKey: string): Promise<void> {
    await this.makeRequest<any>({
      method: HttpMethod.GET,
      url: '/v1/people/list',
      apiKey,
    });
  },

  async makeRequest<T>({
    method,
    url,
    apiKey,
    body,
    headers,
  }: {
    method: HttpMethod;
    url: string;
    apiKey: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Folk API error: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },

  async getPeople({ apiKey, limit = 100, offset = 0 }: { apiKey: string; limit?: number; offset?: number }) {
    return this.makeRequest<{ people: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/people/list?limit=${limit}&offset=${offset}`,
      apiKey,
    });
  },

  async getPerson({ apiKey, contactId }: { apiKey: string; contactId: string }) {
    return this.makeRequest<{ contact: any }>({
      method: HttpMethod.GET,
      url: `/v1/people/${contactId}`,
      apiKey,
    });
  },

  async searchPerson({ apiKey, query }: { apiKey: string; query: string }) {
    return this.makeRequest<{ people: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/people/search?query=${encodeURIComponent(query)}`,
      apiKey,
    });
  },

  async createPerson({ apiKey, data }: { apiKey: string; data: any }) {
    return this.makeRequest<{ contact: any }>({
      method: HttpMethod.POST,
      url: '/v1/people/create',
      apiKey,
      body: data,
    });
  },

  async updatePerson({ apiKey, contactId, data }: { apiKey: string; contactId: string; data: any }) {
    return this.makeRequest<{ contact: any }>({
      method: HttpMethod.PATCH,
      url: `/v1/people/${contactId}`,
      apiKey,
      body: data,
    });
  },

  async getCompanies({ apiKey, limit = 100, offset = 0 }: { apiKey: string; limit?: number; offset?: number }) {
    return this.makeRequest<{ companies: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/companies/list?limit=${limit}&offset=${offset}`,
      apiKey,
    });
  },

  async getCompany({ apiKey, companyId }: { apiKey: string; companyId: string }) {
    return this.makeRequest<{ company: any }>({
      method: HttpMethod.GET,
      url: `/v1/companies/${companyId}`,
      apiKey,
    });
  },

  async searchCompany({ apiKey, query }: { apiKey: string; query: string }) {
    return this.makeRequest<{ companies: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/companies/search?query=${encodeURIComponent(query)}`,
      apiKey,
    });
  },

  async createCompany({ apiKey, data }: { apiKey: string; data: any }) {
    return this.makeRequest<{ company: any }>({
      method: HttpMethod.POST,
      url: '/v1/companies/create',
      apiKey,
      body: data,
    });
  },

  async updateCompany({ apiKey, companyId, data }: { apiKey: string; companyId: string; data: any }) {
    return this.makeRequest<{ company: any }>({
      method: HttpMethod.PATCH,
      url: `/v1/companies/${companyId}`,
      apiKey,
      body: data,
    });
  },

  async getGroups({ apiKey }: { apiKey: string }) {
    return this.makeRequest<{ groups: any[] }>({
      method: HttpMethod.GET,
      url: '/v1/groups/list',
      apiKey,
    });
  },
};


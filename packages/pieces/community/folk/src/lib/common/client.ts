import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { folkAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

export const folkClient = {
  baseUrl: 'https://api.folk.app',

  async testConnection(apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>): Promise<void> {
    await this.makeRequest<any>({
      method: HttpMethod.GET,
      url: '/v1/people?limit=1',
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
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(
        `Folk API error: ${response.status} ${JSON.stringify(response.body)}`
      );
    }

    return response.body;
  },

  async getPeople({
    apiKey,
    limit = 100,
    offset = 0,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    limit?: number;
    offset?: number;
  }) {
    return this.makeRequest<{ people: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/people/list?limit=${limit}&offset=${offset}`,
      apiKey,
    });
  },

  async getPeopleWithFilters({
    apiKey,
    limit = 20,
    cursor,
    combinator = 'and',
    nameFilter,
    emailFilter,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    limit?: number;
    cursor?: string;
    combinator?: 'and' | 'or';
    nameFilter?: string;
    emailFilter?: string;
  }) {
    const params = new URLSearchParams();

    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    
    // Only add combinator and filters if we actually have filters
    const hasFilters = nameFilter || emailFilter;
    if (hasFilters) {
      if (combinator) params.append('combinator', combinator);
      if (nameFilter) {
        params.append('filter[fullName][like]', nameFilter);
      }
      if (emailFilter) {
        params.append('filter[emails][like]', emailFilter);
      }
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/people?${queryString}` : '/v1/people';

    return this.makeRequest<{
      data: {
        items: any[];
        pagination: { nextLink?: string };
      };
    }>({
      method: HttpMethod.GET,
      url,
      apiKey,
    });
  },

  async getPerson({
    apiKey,
    contactId,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    contactId: string;
  }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.GET,
      url: `/v1/people/${contactId}`,
      apiKey,
    });
  },

  async searchPerson({ apiKey, query }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; query: string }) {
    return this.makeRequest<{ people: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/people/search?query=${encodeURIComponent(query)}`,
      apiKey,
    });
  },

  async createPerson({ apiKey, data }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; data: any }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.POST,
      url: '/v1/people',
      apiKey: apiKey,
      body: data,
    });
  },

  async updatePerson({
    apiKey,
    contactId,
    data,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    contactId: string;
    data: any;
  }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.PATCH,
      url: `/v1/people/${contactId}`,
      apiKey,
      body: data,
    });
  },

  async getCompanies({
    apiKey,
    limit = 100,
    offset = 0,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    limit?: number;
    offset?: number;
  }) {
    return this.makeRequest<{ companies: any[] }>({
      method: HttpMethod.GET,
      url: `/v1/companies/list?limit=${limit}&offset=${offset}`,
      apiKey,
    });
  },

  async getCompaniesWithFilters({ 
    apiKey, 
    limit = 20, 
    cursor, 
    combinator = 'and',
    nameFilter 
  }: { 
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; 
    limit?: number; 
    cursor?: string;
    combinator?: 'and' | 'or';
    nameFilter?: string;
  }) {
    const params = new URLSearchParams();
    
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);
    
    // Only add combinator and filters if we actually have filters
    if (nameFilter) {
      if (combinator) params.append('combinator', combinator);
      params.append('filter[name][like]', nameFilter);
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/companies?${queryString}` : '/v1/companies';

    return this.makeRequest<{ 
      data: { 
        items: any[]; 
        pagination: { nextLink?: string } 
      } 
    }>({
      method: HttpMethod.GET,
      url,
      apiKey,
    });
  },

  async getCompany({
    apiKey,
    companyId,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    companyId: string;
  }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.GET,
      url: `/v1/companies/${companyId}`,
      apiKey,
    });
  },

  async searchCompany({ apiKey, query }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; query: string }) {
    return this.makeRequest<{
      data: { items: any[]; pagination: { nextLink: string } };
    }>({
      method: HttpMethod.GET,
      url: `/v1/companies?limit=100&filter[name][like]=${encodeURIComponent(
        query
      )}`,
      apiKey,
    });
  },

  async createCompany({ apiKey, data }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; data: any }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.POST,
      url: '/v1/companies',
      apiKey: apiKey,
      body: data,
    });
  },

  async updateCompany({
    apiKey,
    companyId,
    data,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    companyId: string;
    data: any;
  }) {
    return this.makeRequest<{ data: any }>({
      method: HttpMethod.PATCH,
      url: `/v1/companies/${companyId}`,
      apiKey,
      body: data,
    });
  },

  async getGroups({ apiKey }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth> }) {
    return this.makeRequest<{
      data: { items: any[]; pagination: { nextLink?: string } };
    }>({
      method: HttpMethod.GET,
      url: '/v1/groups',
      apiKey,
    });
  },

  async createWebhook({
    apiKey,
    name,
    targetUrl,
    subscribedEvents,
  }: {
    apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>;
    name: string;
    targetUrl: string;
    subscribedEvents: Array<{
      eventType: string;
      filter?: {
        groupId?: string;
        objectType?: string;
        path?: string[];
        value?: string;
      };
    }>;
  }) {
    return this.makeRequest<{
      data: {
        id: string;
        name: string;
        targetUrl: string;
        subscribedEvents: Array<{
          eventType: string;
          filter: Record<string, any>;
        }>;
        signingSecret: string;
        status: string;
        createdAt: string;
      };
    }>({
      method: HttpMethod.POST,
      url: '/v1/webhooks',
      apiKey,
      body: {
        name,
        targetUrl,
        subscribedEvents,
      },
    });
  },

  async deleteWebhook({ apiKey, webhookId }: { apiKey: AppConnectionValueForAuthProperty<typeof folkAuth>; webhookId: string }) {
    return this.makeRequest<void>({
      method: HttpMethod.DELETE,
      url: `/v1/webhooks/${webhookId}`,
      apiKey,
      body: {}
    });
  },
};

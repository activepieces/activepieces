import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const API_BASE_URL = 'https://api.capsulecrm.com/api/v2';

export const capsuleCommon = {
  baseUrl: API_BASE_URL,
  
  async makeRequest<T = any>(
    auth: OAuth2PropertyValue,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return response.body;
  },

  async getParties(auth: OAuth2PropertyValue, type?: 'person' | 'organisation') {
    const endpoint = type ? `/parties?filter[type]=${type}` : '/parties';
    return this.makeRequest(auth, HttpMethod.GET, endpoint);
  },

  async getOpportunities(auth: OAuth2PropertyValue) {
    return this.makeRequest(auth, HttpMethod.GET, '/opportunities');
  },

  async getProjects(auth: OAuth2PropertyValue) {
    return this.makeRequest(auth, HttpMethod.GET, '/projects');
  },

  async getTasks(auth: OAuth2PropertyValue) {
    return this.makeRequest(auth, HttpMethod.GET, '/tasks');
  },

  async getCases(auth: OAuth2PropertyValue) {
    return this.makeRequest(auth, HttpMethod.GET, '/cases');
  },
};


import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const crispClient = {
  baseUrl: 'https://api.crisp.chat/v1',

  async makeRequest(auth: string, method: HttpMethod, endpoint: string, body?: any) {
    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json'
      },
      body
    });
    return response.body;
  },

  // Conversation methods
  async getConversations(auth: string, websiteId: string) {
    return this.makeRequest(auth, HttpMethod.GET, `/website/${websiteId}/conversations`);
  },

  // Contact methods
  async getContact(auth: string, websiteId: string, contactId: string) {
    return this.makeRequest(auth, HttpMethod.GET, `/website/${websiteId}/people/profile/${contactId}`);
  },
  
  
};
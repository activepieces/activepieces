import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const crispClient = {
  baseUrl: 'https://api.crisp.chat/v1',

  async makeRequest(auth: string, method: HttpMethod, endpoint: string, body?: any) {
    const response = await httpClient.sendRequest({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `${auth}`,
        'X-Crisp-Tier': 'plugin',
        'Content-Type': 'application/json'
      },
      body
    });

    return response.body;
  },
  // Conversation methods
  async getConversations(key: string, websiteId: string) {
    return this.makeRequest(key ,HttpMethod.GET, `/website/${websiteId}/conversations`);
  },

  // Contact methods
  async getContact(auth: string, websiteId: string, contactId: string) {
    return this.makeRequest(auth, HttpMethod.GET, `/website/${websiteId}/people/profile/${contactId}`);
  },

async getConversation(auth: string, websiteId: string, sessionId: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/conversation/${sessionId}`
  );
},

async listContacts(auth: string, websiteId: string, limit: number = 50) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/list?limit=${limit}`
  );
},

async searchConversations(auth: string, websiteId: string, params: URLSearchParams) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/conversations/search?${params.toString()}`
  );
},

async getProfile(auth: string, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/profile/${email}`
  );
},

async getProfileConversations(auth: string, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/conversations/${email}`
  );
},

async getProfileEvents(auth: string, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/events/${email}`
  );
}
};
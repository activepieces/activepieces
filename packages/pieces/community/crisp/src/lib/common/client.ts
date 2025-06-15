import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const crispClient = {
  baseUrl: 'https://api.crisp.chat/v1',

  async makeRequest(
  auth: { token: string, identifier: string } | string,
  method: HttpMethod,
  endpoint: string,
  body?: any
) {
  const authHeader = typeof auth === 'string'
    ? `Basic ${Buffer.from(auth).toString('base64')}`
    : `Basic ${Buffer.from(`${auth.identifier}:${auth.token}`).toString('base64')}`;

  const response = await httpClient.sendRequest({
    method,
    url: `${this.baseUrl}${endpoint}`,
    headers: {
      'Authorization': authHeader,
      'X-Crisp-Tier': 'plugin',
      'Content-Type': 'application/json'
    },
    body
  });

    return response.body;
  },
  // Conversation methods
  async getConversations(auth:any, websiteId: string) {
    return this.makeRequest(auth ,HttpMethod.GET, `${websiteId}`);
  },

  // Contact methods
  async getContact(auth:any, websiteId: string, contactId: string) {
    return this.makeRequest(auth, HttpMethod.GET, `/website/${websiteId}/people/profile/${contactId}`);
  },

async getConversation(auth:any, websiteId: string, sessionId: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/conversation/${sessionId}`
  );
},

async listContacts(auth:any, websiteId: string, limit: number = 50) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/list?limit=${limit}`
  );
},

async searchConversations(auth:any, websiteId: string, params: URLSearchParams) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/conversations/search?${params.toString()}`
  );
},

async getProfile(auth:any, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/profile/${email}`
  );
},

async getProfileConversations(auth:any, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/conversations/${email}`
  );
},

async getProfileEvents(auth:any, websiteId: string, email: string) {
  return this.makeRequest(
    auth,
    HttpMethod.GET,
    `/website/${websiteId}/people/events/${email}`
  );
}
};
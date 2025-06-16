export const gmailCommon = {
  baseUrl: 'https://gmail.googleapis.com/gmail/v1',
  
  async makeRequest(
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  async getProfile(accessToken: string) {
    return this.makeRequest(accessToken, 'GET', '/users/me/profile');
  },

  async getLabels(accessToken: string) {
    return this.makeRequest(accessToken, 'GET', '/users/me/labels');
  },

  async getMessage(accessToken: string, messageId: string) {
    return this.makeRequest(accessToken, 'GET', `/users/me/messages/${messageId}`);
  },

  async getThread(accessToken: string, threadId: string) {
    return this.makeRequest(accessToken, 'GET', `/users/me/threads/${threadId}`);
  },

  decodeBase64Url(str: string): string {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  },

  encodeBase64Url(str: string): string {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  },
};
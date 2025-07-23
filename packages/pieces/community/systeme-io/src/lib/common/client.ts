import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const systemeIoCommon = {
  baseUrl: 'https://api.systeme.io/api',

  async apiCall<T>({
    method,
    url,
    body,
    auth,
  }: {
    method: HttpMethod;
    url: string;
    body?: any;
    auth: { apiKey: string };
  }): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'X-API-Key': auth.apiKey,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Systeme.io API error: ${response.status}`);
    }

    return response.body;
  },

  async createWebhook({
    eventType,
    webhookUrl,
    auth,
    secret,
  }: {
    eventType: string;
    webhookUrl: string;
    auth: { apiKey: string };
    secret: string;
  }) {
    return this.apiCall<{ id: string }>({
      method: HttpMethod.POST,
      url: '/webhooks',
      body: {
        name: `Activepieces Webhook - ${eventType}`,
        url: webhookUrl,
        subscriptions: [eventType],
        secret: secret,
      },
      auth,
    });
  },

  async deleteWebhook({
    webhookId,
    auth,
  }: {
    webhookId: string;
    auth: { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.DELETE,
      url: `/webhooks/${webhookId}`,
      auth,
    });
  },

  async getContacts({
    auth,
    limit = 50,
    startingAfter,
  }: {
    auth: { apiKey: string };
    limit?: number;
    startingAfter?: string;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (startingAfter) params.append('startingAfter', startingAfter);

    return this.apiCall({
      method: HttpMethod.GET,
      url: `/contacts?${params.toString()}`,
      auth,
    });
  },

  async getContact({
    contactId,
    auth,
  }: {
    contactId: string;
    auth: { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: `/contacts/${contactId}`,
      auth,
    });
  },

  async getTags({
    auth,
  }: {
    auth: { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: '/tags',
      auth,
    });
  },
};

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import crypto from 'crypto';

export const systemeIoCommon = {
  baseUrl: 'https://api.systeme.io/api',

  async apiCall<T>({
    method,
    url,
    body,
    auth,
    headers,
  }: {
    method: HttpMethod;
    url: string;
    body?: any;
    auth: string | { apiKey: string };
    headers?: Record<string, string>;
  }): Promise<T> {
    const apiKey = typeof auth === 'string' ? auth : auth.apiKey;
    
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Systeme.io API error: ${response.status}`);
    }

    return response.body;
  },

  verifyWebhookSignature: (
    webhookSecret?: string,
    webhookSignatureHeader?: string,
    webhookRawBody?: any,
  ): boolean => {
    if (!webhookSecret || !webhookSignatureHeader || !webhookRawBody) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(webhookRawBody);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(webhookSignatureHeader, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      return false;
    }
  },

  async createWebhook({
    eventType,
    webhookUrl,
    auth,
    secret,
  }: {
    eventType: string;
    webhookUrl: string;
    auth: string | { apiKey: string };
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
    auth: string | { apiKey: string };
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
    auth: string | { apiKey: string };
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
    auth: string | { apiKey: string };
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
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: '/tags',
      auth,
    });
  },

  async getContactFields({
    auth,
  }: {
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: '/contact_fields',
      auth,
    });
  },
};

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PaperformFormsResponse, PaperformWebhookResponse } from './types';

export const paperformCommon = {
  baseUrl: 'https://api.paperform.co/v1',

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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (response.status >= 400) {
      throw new Error(`Paperform API error: ${response.status}`);
    }

    return response.body;
  },

  async getForms({
    auth,
    limit = 50,
    skip = 0,
  }: {
    auth: string | { apiKey: string };
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall<PaperformFormsResponse>({
      method: HttpMethod.GET,
      url: `/forms?${params.toString()}`,
      auth,
    });
  },

  async getForm({
    formId,
    auth,
  }: {
    formId: string;
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: `/forms/${formId}`,
      auth,
    });
  },

  async getSubmissions({
    formId,
    auth,
    limit = 50,
    skip = 0,
  }: {
    formId: string;
    auth: string | { apiKey: string };
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());

    return this.apiCall({
      method: HttpMethod.GET,
      url: `/forms/${formId}/submissions?${params.toString()}`,
      auth,
    });
  },

  async getSubmission({
    submissionId,
    auth,
  }: {
    submissionId: string;
    auth: string | { apiKey: string };
  }) {
    return this.apiCall({
      method: HttpMethod.GET,
      url: `/submissions/${submissionId}`,
      auth,
    });
  },

  async createWebhook({
    formId,
    webhookUrl,
    auth,
    eventType,
  }: {
    formId: string;
    webhookUrl: string;
    auth: string | { apiKey: string };
    eventType: string;
  }) {
    return this.apiCall<PaperformWebhookResponse>({
      method: HttpMethod.POST,
      url: `/forms/${formId}/webhooks`,
      body: {
        target_url: webhookUrl,
        triggers: [eventType],
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
};

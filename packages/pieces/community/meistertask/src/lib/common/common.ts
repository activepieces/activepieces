import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const meisterTaskCommon = {
  baseUrl: 'https://www.meistertask.com/api',
  
  async makeRequest<T>(
    method: HttpMethod,
    url: string,
    accessToken: string,
    body?: unknown
  ): Promise<T> {
    const request: HttpRequest = {
      method,
      url: `${this.baseUrl}${url}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    };
    
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  },
  
   async createWebhook(
    accessToken: string,
    webhookUrl: string,
    targetType: string,
    targetId: string,
    events: string[]
  ): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>(
      HttpMethod.POST,
      '/webhooks',
      accessToken,
      {
        target_type: targetType,
        target_id: targetId,
        events,
        url: webhookUrl,
      }
    );
  },
  
  async deleteWebhook(
    accessToken: string,
    webhookId: string
  ): Promise<void> {
    await this.makeRequest(
      HttpMethod.DELETE,
      `/webhooks/${webhookId}`,
      accessToken
    );
  },
};
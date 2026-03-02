import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getAuthHeaders, getBaseUrl, getTokenPayload } from './auth';
import { dynamicProps } from './dynamic-props';

export const gauzyWebhookCommon = {
  organizationId: dynamicProps.organizations,

  async createWebhook(auth: OAuth2PropertyValue, webhookUrl: string, organizationId: string, events: string[], filter?: Record<string, unknown>) {
    const baseUrl = getBaseUrl(auth);
    const headers = getAuthHeaders(auth);
    const payload = getTokenPayload(auth);
    const tenantId = payload['tenantId'] as string;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/integration/activepieces/webhooks`,
      headers,
      body: {
        name: `ActivePieces ${events[0]} Webhook`,
        targetUrl: webhookUrl,
        tenantId: tenantId,
        organizationId: organizationId,
        events: events,
        filter: filter || {},
        active: true,
      },
    });
    
    return response.body.id;
  },
  
  async deleteWebhook(auth: OAuth2PropertyValue, webhookId: string) {
    const baseUrl = getBaseUrl(auth);
    const headers = getAuthHeaders(auth);
    
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${baseUrl}/api/integration/activepieces/webhooks/${webhookId}`,
      headers,
    });
  }
}
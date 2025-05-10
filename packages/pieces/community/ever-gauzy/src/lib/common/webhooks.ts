import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getAuthHeaders, getBaseUrl } from './auth';

export const gauzyWebhookCommon = {
  organizationId: Property.ShortText({
    displayName: 'Organization ID',
    required: false,
    description: 'The ID of the organization to monitor for events',
  }),

  tenantId: Property.ShortText({
    displayName: 'Tenant ID',
    required: true,
    description: 'The ID of the tenant to monitor for events',
  }),
  
  async createWebhook(auth: OAuth2PropertyValue, webhookUrl: string, organizationId: string, tenantId: string, events: string[], filter?: Record<string, unknown>) {
    const baseUrl = getBaseUrl(auth);
    const headers = getAuthHeaders(auth);
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/webhooks`,
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
      url: `${baseUrl}/webhooks/${webhookId}`,
      headers,
    });
  }
}
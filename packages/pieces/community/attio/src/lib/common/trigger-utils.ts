import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, WebhookResponse } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export interface WebhookHandlerOptions {
  webhookUrl: string;
  auth: string;
}

export async function setupAttioWebhook(opts: WebhookHandlerOptions, eventType: string, object_id: string) {
  const { webhookUrl, auth } = opts;

  // Create webhook subscription
  const response = await makeRequest(
    auth,
    HttpMethod.POST,
    '/webhook-subscriptions',
    {
      url: webhookUrl,
      events: [eventType],
      object_id: object_id
    }
  );

  return {
    webhookId: response.id,
  };
}

export async function unregisterAttioWebhook(webhookId: string, auth: string) {
  await makeRequest(
    auth,
    HttpMethod.DELETE,
    `/webhook-subscriptions/${webhookId}`,
    undefined
  );
}

export const webhookFilter = (payload: WebhookResponse) => !!payload.body;

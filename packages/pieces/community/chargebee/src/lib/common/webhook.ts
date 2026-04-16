import { HttpMethod } from '@activepieces/pieces-common';

import { chargebeeRequest } from './client';

type WebhookResponse = {
  webhook: { id: string };
};

export async function subscribeChargebeeWebhook(
  site: string,
  apiKey: string,
  webhookUrl: string,
  eventType: string
): Promise<string> {
  const response = await chargebeeRequest<WebhookResponse>({
    site,
    apiKey,
    method: HttpMethod.POST,
    path: '/webhook_endpoints',
    contentType: 'application/x-www-form-urlencoded',
    body: {
      webhook_url: webhookUrl,
      'subscribed_events[0]': eventType,
      is_active: true,
    },
  });
  return response.webhook.id;
}

export async function unsubscribeChargebeeWebhook(
  site: string,
  apiKey: string,
  webhookId: string
): Promise<void> {
  await chargebeeRequest({
    site,
    apiKey,
    method: HttpMethod.POST,
    path: `/webhook_endpoints/${webhookId}/delete`,
  });
}

export async function fetchRecentEvents(
  site: string,
  apiKey: string,
  eventType: string
): Promise<unknown[]> {
  const response = await chargebeeRequest<{
    list: Array<{ event: unknown }>;
  }>({
    site,
    apiKey,
    method: HttpMethod.GET,
    path: `/events?limit=5&event_type[is]=${eventType}`,
  });
  return (response.list ?? []).map((item) => item.event);
}

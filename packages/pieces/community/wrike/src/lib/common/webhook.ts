import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wrikeCommon } from './client';

export const wrikeWebhook = { register, unregister, eventsOfType };

async function register({
  auth,
  webhookUrl,
  eventType,
  folderId,
}: {
  auth: OAuth2PropertyValue;
  webhookUrl: string;
  eventType: string;
  folderId?: string;
}): Promise<string> {
  const { status, body } = await wrikeCommon.apiCall({
    auth,
    method: HttpMethod.POST,
    resourceUri: folderId ? `/folders/${folderId}/webhooks` : '/webhooks',
    body: { hookUrl: webhookUrl, events: [eventType] },
  });
  if (status !== 200) {
    throw new Error(
      `Failed to register webhook. Status: ${status}, Body: ${JSON.stringify(body)}`
    );
  }
  return body.data[0].id;
}

async function unregister({
  auth,
  webhookId,
}: {
  auth: OAuth2PropertyValue;
  webhookId: string;
}): Promise<void> {
  await wrikeCommon
    .apiCall({
      auth,
      method: HttpMethod.DELETE,
      resourceUri: `/webhooks/${webhookId}`,
    })
    .catch(() => undefined);
}

function eventsOfType({
  body,
  eventType,
}: {
  body: unknown;
  eventType: string;
}): WrikeWebhookEvent[] {
  const events = Array.isArray(body) ? body : [body];
  return events.filter(
    (event): event is WrikeWebhookEvent =>
      typeof event === 'object' &&
      event !== null &&
      'eventType' in event &&
      event.eventType === eventType
  );
}

export type WrikeWebhookEvent = {
  eventType: string;
  webhookId?: string;
  eventAuthorId?: string;
  taskId?: string;
  folderId?: string;
  lastUpdatedDate?: string;
};

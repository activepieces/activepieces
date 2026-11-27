import { HttpMethod } from '@activepieces/pieces-common';
import { boxClient } from './client';
import type { BoxAuthValue, BoxWebhook, BoxWebhookTarget } from './types';

async function createWebhook({
  auth,
  event,
  target,
  webhookUrl,
}: {
  auth: BoxAuthValue;
  event: string;
  target: BoxWebhookTarget;
  webhookUrl: string;
}): Promise<BoxWebhook> {
  return await boxClient.request<BoxWebhook>({
    auth,
    method: HttpMethod.POST,
    path: '/webhooks',
    body: {
      address: webhookUrl,
      triggers: [event],
      target,
    },
  });
}

async function deleteWebhook({ auth, webhookId }: { auth: BoxAuthValue; webhookId: string }): Promise<void> {
  await boxClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/webhooks/${webhookId}`,
  });
}

export const boxApi = { createWebhook, deleteWebhook };

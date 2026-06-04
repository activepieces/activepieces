import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { useinboxAuth } from './auth';
import { useinboxClient } from './client';

type NotifyEvent =
  | { id: 0; key: 'hard_bounce' }
  | { id: 1; key: 'soft_bounce' }
  | { id: 2; key: 'spam_reported' }
  | { id: 3; key: 'blocked' }
  | { id: 4; key: 'delivered' }
  | { id: 5; key: 'opened' }
  | { id: 6; key: 'unique_opens' }
  | { id: 7; key: 'clicked' };

type CreateWebhookResponse = {
  resultStatus: boolean;
  resultCode: number;
  resultMessage: string;
  resultObject?: {
    id?: string;
    url?: string;
    description?: string;
    events?: number[];
  };
};

const STORE_KEY_PREFIX = 'useinbox_notify_webhook_';

export function createNotifyWebhookTrigger({
  event,
  name,
  displayName,
  description,
  sampleData,
}: {
  event: NotifyEvent;
  name: string;
  displayName: string;
  description: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: useinboxAuth,
    name,
    displayName,
    description,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const token = await useinboxClient.fetchAccessToken({
        email: context.auth.username,
        password: context.auth.password,
      });
      const response = await useinboxClient.inboxApiCall<CreateWebhookResponse>({
        token,
        service: 'notify',
        method: HttpMethod.POST,
        path: '/webhooks',
        body: {
          url: context.webhookUrl,
          description: `Activepieces ${displayName}`,
          events: [event.id],
        },
      });
      const webhookId = response.body?.resultObject?.id;
      if (webhookId) {
        await context.store.put(`${STORE_KEY_PREFIX}${name}`, webhookId);
      }
    },
    async onDisable(context) {
      const webhookId = await context.store.get<string>(`${STORE_KEY_PREFIX}${name}`);
      if (!webhookId) return;
      try {
        const token = await useinboxClient.fetchAccessToken({
          email: context.auth.username,
          password: context.auth.password,
        });
        await useinboxClient.inboxApiCall({
          token,
          service: 'notify',
          method: HttpMethod.DELETE,
          path: `/webhooks/${webhookId}`,
        });
      } catch {
        // Ignore cleanup errors so the flow can still be disabled.
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}

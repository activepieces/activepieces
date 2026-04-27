import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { qawafelAuth } from './auth';
import { qawafelApiCall } from './client';

const WEBHOOK_STORE_KEY_PREFIX = 'qawafel_webhook_';

export function createQawafelEventTrigger({
  name,
  displayName,
  description,
  event,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  event: QawafelEventType;
  sampleData: Record<string, unknown>;
}) {
  const webhookKey = `${WEBHOOK_STORE_KEY_PREFIX}${event}`;
  return createTrigger({
    auth: qawafelAuth,
    name,
    displayName,
    description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
      id: 'whd_01jk5jtv3x7f6ijkgdxawvcejr',
      api_version: 'v1',
      timestamp: 1705312200,
      event,
      data: sampleData,
    },
    async onEnable(context) {
      const response = await qawafelApiCall<QawafelWebhookCreated>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/webhooks',
        body: {
          url: context.webhookUrl,
          event,
          description: 'Activepieces webhook subscription',
        },
      });
      await context.store.put<QawafelWebhookStoredHandle>(webhookKey, {
        webhookId: response.body.id,
      });
    },
    async onDisable(context) {
      const stored = await context.store.get<QawafelWebhookStoredHandle>(
        webhookKey
      );
      if (!stored?.webhookId) return;
      try {
        await qawafelApiCall({
          auth: context.auth,
          method: HttpMethod.DELETE,
          path: `/webhooks/${stored.webhookId}`,
        });
      } catch {
        // Qawafel may have already disabled the webhook after delivery failures — ignore.
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}

export type QawafelEventType =
  | 'invoice.paid'
  | 'invoice.generated'
  | 'merchant.created'
  | 'order.created'
  | 'product.created'
  | 'product.updated'
  | 'credit_note.created';

type QawafelWebhookCreated = {
  id: string;
  url: string;
  event: QawafelEventType;
  secret: string;
};

type QawafelWebhookStoredHandle = {
  webhookId: string;
};

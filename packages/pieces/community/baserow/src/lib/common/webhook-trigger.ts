import { BaserowJwtAuthValue } from '../auth';
import { makeJwtClient } from './index';

export function createWebhookTriggerHooks(
  eventType: string,
  storeKey: string
) {
  return {
    async onEnable(context: {
      auth: BaserowJwtAuthValue;
      propsValue: { table_id: number };
      webhookUrl: string;
      store: {
        put: <T>(key: string, value: T) => Promise<T>;
      };
    }): Promise<void> {
      const client = await makeJwtClient(context.auth);
      const webhook = await client.createWebhook(
        context.propsValue.table_id,
        context.webhookUrl,
        [eventType],
        `Activepieces – ${storeKey}`
      );
      await context.store.put(storeKey, { webhookId: webhook.id });
    },
    async onDisable(context: {
      auth: BaserowJwtAuthValue;
      store: {
        get: <T>(key: string) => Promise<T | null>;
      };
    }): Promise<void> {
      const data = await context.store.get<{ webhookId: number }>(storeKey);
      if (!data?.webhookId) return;
      const client = await makeJwtClient(context.auth);
      await client.deleteWebhook(data.webhookId);
    },
  };
}

import { BaserowAuthValue, isDatabaseTokenAuth } from '../auth';
import { makeClient } from './index';

export function createWebhookTriggerHooks(
  eventType: string,
  storeKey: string
) {
  return {
    async onEnable(context: {
      auth: BaserowAuthValue;
      propsValue: { table_id: number | undefined };
      webhookUrl: string;
      store: {
        put: <T>(key: string, value: T) => Promise<T>;
      };
    }): Promise<void> {
      if (isDatabaseTokenAuth(context.auth)) {
        throw new Error(
          'Baserow triggers require Email & Password (JWT) authentication. Please reconnect using the "Email & Password (JWT)" option.'
        );
      }
      if (!context.propsValue.table_id) return;
      const client = await makeClient(context.auth);
      const webhook = await client.createWebhook(
        context.propsValue.table_id,
        context.webhookUrl,
        [eventType],
        `Activepieces – ${storeKey}`
      );
      await context.store.put(storeKey, { webhookId: webhook.id });
    },
    async onDisable(context: {
      auth: BaserowAuthValue;
      store: {
        get: <T>(key: string) => Promise<T | null>;
        delete: (key: string) => Promise<void>;
      };
    }): Promise<void> {
      if (isDatabaseTokenAuth(context.auth)) return;
      const data = await context.store.get<{ webhookId: number }>(storeKey);
      if (!data?.webhookId) return;
      const client = await makeClient(context.auth);
      try {
        await client.deleteWebhook(data.webhookId);
      } catch {
        // Webhook may have been manually deleted in Baserow — ignore
      }
      await context.store.delete(storeKey);
    },
  };
}

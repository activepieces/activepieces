import { BaserowAuthValue, baserowAuthHelpers } from '../auth';
import { makeClient } from './index';

export function createWebhookTriggerHooks({
  events,
  storeKey,
}: {
  events: string[];
  storeKey: string;
}) {
  return {
    async onEnable(context: {
      auth: BaserowAuthValue;
      propsValue: { table_id: number | undefined };
      webhookUrl: string;
      store: {
        put: <T>(key: string, value: T) => Promise<T>;
      };
    }): Promise<void> {
      if (!baserowAuthHelpers.isJwtAuth(context.auth)) return;
      if (!context.propsValue.table_id) return;
      const client = await makeClient(context.auth);
      const webhook = await client.createWebhook({
        tableId: context.propsValue.table_id,
        url: context.webhookUrl,
        events,
        name: `Activepieces – ${storeKey}`,
      });
      await context.store.put(storeKey, { webhookId: webhook.id });
    },
    async onDisable(context: {
      auth: BaserowAuthValue;
      store: {
        get: <T>(key: string) => Promise<T | null>;
        delete: (key: string) => Promise<void>;
      };
    }): Promise<void> {
      if (!baserowAuthHelpers.isJwtAuth(context.auth)) return;
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

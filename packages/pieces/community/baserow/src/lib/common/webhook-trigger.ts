import { MarkdownVariant } from '@activepieces/pieces-framework';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { BaserowAuthValue, baserowAuth, baserowAuthHelpers } from '../auth';
import { makeClient } from './index';

export function dynamicWebhookInstructions(eventLabel: string) {
  return Property.DynamicProperties({
    auth: baserowAuth,
    displayName: 'Webhook Setup',
    required: false,
    refreshers: ['auth'],
    props: async ({ auth }): Promise<DynamicPropsValue> => {
      if (auth && baserowAuthHelpers.isJwtAuth(auth as BaserowAuthValue)) {
        return {
          info: Property.MarkDown({
            value: '✅ **Webhook auto-registered** — no manual setup needed. The webhook is created and removed automatically when you enable or disable this trigger.',
            variant: MarkdownVariant.INFO,
          }),
        };
      }
      return {
        info: Property.MarkDown({
          value: `**Manual webhook setup required** — a Database Token cannot create webhooks in Baserow, so this trigger stays silent until you add the webhook yourself:

1. In Baserow, click the **···** menu beside your table and select **Webhooks**.
2. Click **Create webhook +**.
3. Leave **Method** on **POST**, and paste this into the **URL** field:
\`\`\`
{{webhookUrl}}
\`\`\`
4. Tick **User field names** (“Use field name instead of id”), otherwise fields arrive as \`field_1234\`.
5. Under **Which events should trigger this webhook?**, choose **Let me select individual events** and tick **${eventLabel}**.
6. Click **Save**.

Baserow keeps this webhook even after you disable the flow — delete it in Baserow when you no longer need it.`,
          variant: MarkdownVariant.INFO,
        }),
      };
    },
  });
}

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

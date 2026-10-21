import { MarkdownVariant, tryCatch } from '@activepieces/pieces-framework';
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
            value: 'This webhook is added to Baserow when the flow is turned on and removed when it is turned off.',
            variant: MarkdownVariant.INFO,
          }),
        };
      }
      return {
        info: Property.MarkDown({
          value: `This connection uses a database token, so add the webhook in Baserow:

1. Open the **···** menu beside the table and pick **Webhooks**.
2. Click **Create webhook +** and set the method to **POST**.
3. Paste the webhook URL shown above.
4. Under **Events**, select **${eventLabel}**, then click **Save**.`,
          variant: MarkdownVariant.WARNING,
        }),
      };
    },
  });
}

export function webhookUrlInfo() {
  return Property.MarkDown({
    value: `Webhook URL for this flow:
\`\`\`text
{{webhookUrl}}
\`\`\``,
    variant: MarkdownVariant.INFO,
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
      await tryCatch(async () => {
        const client = await makeClient(context.auth);
        await client.deleteWebhook(data.webhookId);
      });
      await context.store.delete(storeKey);
    },
  };
}

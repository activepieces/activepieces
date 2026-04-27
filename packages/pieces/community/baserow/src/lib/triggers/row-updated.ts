import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.updated'],
  storeKey: 'baserow_row_updated_trigger',
});

export const rowUpdatedTrigger = createTrigger({
  name: 'baserow_row_updated',
  auth: baserowAuth,
  displayName: 'Row Updated',
  description: 'Triggers when an existing row is updated in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: Property.MarkDown({
      value: `If you authenticated with **Database Token**, the webhook must be created manually:

1. In Baserow, click the **···** menu beside your table and select **Webhooks**.
2. Click **Create webhook +**.
3. Set the HTTP method to **POST**.
4. Paste the following URL into the endpoint field:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Under events, select **Rows updated**.
6. Click **Save**.

If you authenticated with **Email & Password (JWT)**, the webhook is registered automatically — you can ignore the steps above.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    row: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Updated row',
    },
    previous: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Original row',
    },
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as {
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
    };

    return (body.items ?? [])
      .map((item, i) => ({
        row: item,
        previous: (body.old_items ?? [])[i] ?? null,
      }))
      .filter(({ row, previous }) => {
        if (!previous) return true;
        return JSON.stringify(row) !== JSON.stringify(previous);
      });
  },
});

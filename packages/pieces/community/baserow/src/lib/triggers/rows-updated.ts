import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.updated'],
  storeKey: 'baserow_rows_updated_trigger',
});

export const rowsUpdatedTrigger = createTrigger({
  name: 'baserow_rows_updated',
  auth: baserowAuth,
  displayName: 'Rows Updated (Batch)',
  description:
    'Triggers when existing rows are updated in a Baserow table. Returns all rows from the event as a single batch.',
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
    rows: [
      {
        row: { id: 1, order: '1.00000000000000000000', Name: 'Updated Row 1' },
        previous: { id: 1, order: '1.00000000000000000000', Name: 'Original Row 1' },
      },
    ],
    count: 1,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as {
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
    };
    const rows = (body.items ?? []).map((item, i) => ({
      row: item,
      previous: (body.old_items ?? [])[i] ?? null,
    }));
    return [{ rows, count: rows.length }];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = (await client.listRows(tableId, 1, 5)) as {
      results: Record<string, unknown>[];
    };
    const rows = response.results.map((row) => ({ row, previous: null }));
    return [{ rows, count: rows.length }];
  },
});

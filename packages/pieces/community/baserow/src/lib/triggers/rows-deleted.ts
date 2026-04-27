import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.deleted'],
  storeKey: 'baserow_rows_deleted_trigger',
});

export const rowsDeletedTrigger = createTrigger({
  name: 'baserow_rows_deleted',
  auth: baserowAuth,
  displayName: 'Rows Deleted (Batch)',
  description:
    'Triggers when rows are deleted from a Baserow table. Returns all deleted row IDs from the event as a single batch.',
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
5. Under events, select **Rows deleted**.
6. Click **Save**.

If you authenticated with **Email & Password (JWT)**, the webhook is registered automatically — you can ignore the steps above.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    rows: [{ id: 1 }, { id: 2 }],
    count: 2,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as { row_ids?: number[] };
    const rows = (body.row_ids ?? []).map((id) => ({ id }));
    return [{ rows, count: rows.length }];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = (await client.listRows(tableId, 1, 5)) as {
      results: { id: number }[];
    };
    const rows = response.results.map((row) => ({ id: row.id }));
    return [{ rows, count: rows.length }];
  },
});

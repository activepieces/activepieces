import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.deleted'],
  storeKey: 'baserow_row_deleted_trigger',
});

export const rowDeletedTrigger = createTrigger({
  name: 'baserow_row_deleted',
  auth: baserowAuth,
  displayName: 'Row Deleted',
  description: 'Triggers when a row is deleted from a Baserow table.',
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
    id: 1,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as { row_ids?: number[] };
    return (body.row_ids ?? []).map((id) => ({ id }));
  },
});

import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created'],
  storeKey: 'baserow_row_created_trigger',
});

export const rowCreatedTrigger = createTrigger({
  name: 'baserow_row_created',
  auth: baserowAuth,
  displayName: 'Row Created',
  description: 'Triggers when a new row is created in a Baserow table.',
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
5. Under events, select **Rows created**.
6. Click **Save**.

If you authenticated with **Email & Password (JWT)**, the webhook is registered automatically — you can ignore the steps above.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    id: 1,
    order: '1.00000000000000000000',
    Name: 'Example row',
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    return body.items ?? [];
  },
});

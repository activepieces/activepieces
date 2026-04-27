import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created', 'rows.updated', 'rows.deleted'],
  storeKey: 'baserow_row_event_trigger',
});

export const rowEventTrigger = createTrigger({
  name: 'baserow_row_event',
  auth: baserowAuth,
  displayName: 'Row Event',
  description:
    'Triggers when a row is created, updated, or deleted in a Baserow table. To react to only one event type, use the dedicated Row Created, Row Updated, or Row Deleted triggers.',
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
5. Under events, **enable all three of them**: **Rows created**, **Rows updated**, and **Rows deleted**.
6. Click **Save**.

If you authenticated with **Email & Password (JWT)**, a single webhook covering the three events is registered automatically — you can ignore the steps above.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    event_type: 'rows.created',
    row: { id: 1, order: '1.00000000000000000000', Name: 'Example row' },
    previous_row: null,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as {
      event_type?: string;
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
      row_ids?: number[];
    };
    const eventType = body.event_type;
    if (eventType === 'rows.created') {
      return (body.items ?? []).map((row) => ({
        event_type: eventType,
        row,
        previous_row: null,
      }));
    }
    if (eventType === 'rows.updated') {
      return (body.items ?? []).map((row, i) => ({
        event_type: eventType,
        row,
        previous_row: (body.old_items ?? [])[i] ?? null,
      }));
    }
    if (eventType === 'rows.deleted') {
      return (body.row_ids ?? []).map((id) => ({
        event_type: eventType,
        row: { id },
        previous_row: null,
      }));
    }
    return [];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = (await client.listRows(tableId, 1, 5)) as {
      results: Record<string, unknown>[];
    };
    return response.results.map((row) => ({
      event_type: 'rows.created',
      row,
      previous_row: null,
    }));
  },
});

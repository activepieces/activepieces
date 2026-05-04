import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.updated'],
  storeKey: 'baserow_rows_updated_trigger',
});

export const rowsUpdatedTrigger = createTrigger({
  name: 'baserow_rows_updated',
  auth: baserowAuth,
  displayName: 'Updated Rows (Batch)',
  description:
    'Triggers when existing rows are updated in a Baserow table. Returns all rows from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows updated'),
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
    const response = await client.listRows(tableId, 1, 5);
    const rows = response.results.map((row) => ({ row, previous: null }));
    return [{ rows, count: rows.length }];
  },
});

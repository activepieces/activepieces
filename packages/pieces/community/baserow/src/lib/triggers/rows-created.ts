import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created'],
  storeKey: 'baserow_rows_created_trigger',
});

export const rowsCreatedTrigger = createTrigger({
  name: 'baserow_rows_created',
  auth: baserowAuth,
  displayName: 'New Rows (Batch)',
  description:
    'Triggers when new rows are created in a Baserow table. Returns all rows from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows created'),
  },
  sampleData: {
    rows: [
      { id: 1, order: '1.00000000000000000000', Name: 'Row 1' },
      { id: 2, order: '2.00000000000000000000', Name: 'Row 2' },
    ],
    count: 2,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    const rows = body.items ?? [];
    return [{ rows, count: rows.length }];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = await client.listRows(tableId, 1, 5);
    return [{ rows: response.results, count: response.results.length }];
  },
});

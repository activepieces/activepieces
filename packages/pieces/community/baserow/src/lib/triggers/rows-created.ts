import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions, webhookUrlInfo } from '../common/webhook-trigger';
import { listRowsOutputSchema } from '../output-schemas';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created'],
  storeKey: 'baserow_rows_created_trigger',
});

export const rowsCreatedTrigger = createTrigger({
  name: 'baserow_rows_created',
  classification: 'READ',
  outputSchema: listRowsOutputSchema,
  auth: baserowAuth,
  displayName: 'New Rows (Batch)',
  description: 'Triggers once with all the rows created together, as one list.',
  aiMetadata: {
    description:
      'Fires when one or more new rows are created in the selected Baserow table, delivering all rows from a single create event together as one batch. Use to process bulk inserts at once; for one event per row use New Row.',
  },
  type: TriggerStrategy.WEBHOOK,
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Table to Watch',
      icon: 'file',
      props: ['table_id'],
    },
    {
      key: 'setup',
      display: 'section',
      label: 'Webhook',
      icon: 'send',
      props: ['webhook_url', 'instructions'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    webhook_url: webhookUrlInfo(),
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

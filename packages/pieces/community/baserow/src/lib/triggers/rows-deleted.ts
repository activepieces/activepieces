import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.deleted'],
  storeKey: 'baserow_rows_deleted_trigger',
});

export const rowsDeletedTrigger = createTrigger({
  name: 'baserow_rows_deleted',
  auth: baserowAuth,
  displayName: 'Deleted Rows (Batch)',
  description:
    'Triggers when rows are deleted from a Baserow table. Returns all deleted row IDs from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows deleted'),
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

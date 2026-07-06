import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.deleted'],
  storeKey: 'baserow_row_deleted_trigger',
});

export const rowDeletedTrigger = createTrigger({
  name: 'baserow_row_deleted',
  auth: baserowAuth,
  displayName: 'Deleted Row',
  description: 'Triggers when a row is deleted from a Baserow table.',
  aiMetadata: {
    description:
      'Fires when a row is removed from the selected Baserow table, emitting one event per deleted row carrying its ID. Use to react to individual deletions; for the batch form use Deleted Rows (Batch).',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows deleted'),
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
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = await client.listRows(tableId, 1, 5);
    return response.results.map((row) => ({ id: row.id }));
  },
});

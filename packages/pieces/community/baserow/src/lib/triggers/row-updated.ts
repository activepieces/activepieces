import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.updated'],
  storeKey: 'baserow_row_updated_trigger',
});

export const rowUpdatedTrigger = createTrigger({
  name: 'baserow_row_updated',
  auth: baserowAuth,
  displayName: 'Updated Row',
  description: 'Triggers when an existing row is updated in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows updated'),
  },
  sampleData: {
    row: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Updated row',
    },
    previous: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Original row',
    },
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as {
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
    };

    return (body.items ?? [])
      .map((item, i) => ({
        row: item,
        previous: (body.old_items ?? [])[i] ?? null,
      }))
      .filter(({ row, previous }) => {
        if (!previous) return true;
        return JSON.stringify(row) !== JSON.stringify(previous);
      });
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = await client.listRows(tableId, 1, 5);
    return response.results.map((row) => ({ row, previous: null }));
  },
});

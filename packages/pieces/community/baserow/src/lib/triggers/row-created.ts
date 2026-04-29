import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created'],
  storeKey: 'baserow_row_created_trigger',
});

export const rowCreatedTrigger = createTrigger({
  name: 'baserow_row_created',
  auth: baserowAuth,
  displayName: 'New Row',
  description: 'Triggers when a new row is created in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows created'),
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
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = (await client.listRows(tableId, 1, 5)) as {
      results: Record<string, unknown>[];
    };
    return response.results;
  },
});

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon, makeJwtClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.created', 'baserow_rows_created');

export const rowsCreatedTrigger = createTrigger({
  name: 'baserow_rows_created',
  auth: baserowJwtAuth,
  displayName: 'Rows Created (Batch)',
  description:
    'Triggers when new rows are created in a Baserow table. Returns all rows from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
  },
  sampleData: {
    rows: [
      { id: 1, order: '1.00000000000000000000', Name: 'Row 1' },
      { id: 2, order: '2.00000000000000000000', Name: 'Row 2' },
    ],
    count: 2,
  },
  async onEnable(context) {
    await webhookHooks.onEnable(context);
  },
  async onDisable(context) {
    await webhookHooks.onDisable(context);
  },
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    const rows = body.items ?? [];
    return [{ rows, count: rows.length }];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [{ rows: [], count: 0 }];
    const client = await makeJwtClient(context.auth);
    const response = (await client.listRows(tableId, 1, 10)) as {
      results?: unknown[];
    };
    const rows = response.results ?? [];
    return [{ rows, count: rows.length }];
  },
});

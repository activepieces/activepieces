import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon, makeJwtClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.updated', 'baserow_rows_updated');

export const rowsUpdatedTrigger = createTrigger({
  name: 'baserow_rows_updated',
  auth: baserowJwtAuth,
  displayName: 'Rows Updated (Batch)',
  description:
    'Triggers when existing rows are updated in a Baserow table. Returns all rows from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
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
  async onEnable(context) {
    await webhookHooks.onEnable(context);
  },
  async onDisable(context) {
    await webhookHooks.onDisable(context);
  },
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
    if (!tableId) return [{ rows: [], count: 0 }];
    const client = await makeJwtClient(context.auth);
    const response = (await client.listRows(tableId, 1, 10)) as {
      results?: Record<string, unknown>[];
    };
    const rows = (response.results ?? []).map((row) => ({
      row,
      previous: null,
    }));
    return [{ rows, count: rows.length }];
  },
});

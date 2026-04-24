import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.deleted', 'baserow_rows_deleted');

export const rowsDeletedTrigger = createTrigger({
  name: 'baserow_rows_deleted',
  auth: baserowAuth,
  displayName: 'Rows Deleted (Batch)',
  description:
    'Triggers when rows are deleted from a Baserow table. Returns all deleted row IDs from the event as a single batch.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
  },
  sampleData: {
    rows: [{ id: 1 }, { id: 2 }],
    count: 2,
  },
  async onEnable(context) {
    await webhookHooks.onEnable(context);
  },
  async onDisable(context) {
    await webhookHooks.onDisable(context);
  },
  async run(context) {
    const body = context.payload.body as { row_ids?: number[] };
    const rows = (body.row_ids ?? []).map((id) => ({ id }));
    return [{ rows, count: rows.length }];
  },
});

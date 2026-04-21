import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon, makeJwtClient } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.deleted', 'baserow_row_deleted');

export const rowDeletedTrigger = createTrigger({
  name: 'baserow_row_deleted',
  auth: baserowJwtAuth,
  displayName: 'Row Deleted',
  description: 'Triggers when a row is deleted from a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
  },
  sampleData: {
    id: 1,
  },
  async onEnable(context) {
    await webhookHooks.onEnable(context);
  },
  async onDisable(context) {
    await webhookHooks.onDisable(context);
  },
  async run(context) {
    const body = context.payload.body as { row_ids?: number[] };
    return (body.row_ids ?? []).map((id) => ({ id }));
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeJwtClient(context.auth);
    const response = (await client.listRows(tableId, 1, 10)) as {
      results?: { id: number }[];
    };
    return (response.results ?? []).map((row) => ({ id: row.id }));
  },
});

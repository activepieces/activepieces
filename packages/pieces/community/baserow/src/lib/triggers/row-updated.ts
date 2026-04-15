import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.updated', 'baserow_row_updated');

export const rowUpdatedTrigger = createTrigger({
  name: 'baserow_row_updated',
  auth: baserowJwtAuth,
  displayName: 'Row Updated',
  description: 'Triggers when an existing row is updated in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
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
});

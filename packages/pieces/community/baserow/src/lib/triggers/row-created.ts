import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon } from '../common';
import { createWebhookTriggerHooks } from '../common/webhook-trigger';

const webhookHooks = createWebhookTriggerHooks('rows.created', 'baserow_row_created');

export const rowCreatedTrigger = createTrigger({
  name: 'baserow_row_created',
  auth: baserowJwtAuth,
  displayName: 'Row Created',
  description: 'Triggers when a new row is created in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
  },
  sampleData: {
    id: 1,
    order: '1.00000000000000000000',
    Name: 'Example row',
  },
  async onEnable(context) {
    await webhookHooks.onEnable(context);
  },
  async onDisable(context) {
    await webhookHooks.onDisable(context);
  },
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    return body.items ?? [];
  },
});

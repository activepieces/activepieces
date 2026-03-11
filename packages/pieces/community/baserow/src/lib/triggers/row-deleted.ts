import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';

const WEBHOOK_KEY = 'baserow_row_deleted_webhook';

export const rowDeletedTrigger = createTrigger({
  name: 'baserow_row_deleted',
  auth: baserowAuth,
  displayName: 'Row Deleted',
  description: 'Triggers when a row is deleted from a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID to watch. You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
  },
  sampleData: {
    table_id: 1,
    database_id: 1,
    workspace_id: 1,
    event_id: 'event_123',
    event_type: 'rows.deleted',
    row_ids: [1],
  },
  async onEnable(context) {
    const client = makeClient(context.auth.props);
    const table_id = context.propsValue.table_id!;

    const webhook = await client.createWebhook(
      table_id,
      context.webhookUrl,
      ['rows.deleted'],
      `activepieces_row_deleted_${table_id}`
    );

    await context.store.put(WEBHOOK_KEY, {
      webhookId: webhook.id,
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<{ webhookId: number }>(WEBHOOK_KEY);
    if (stored) {
      const client = makeClient(context.auth.props);
      await client.deleteWebhook(stored.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

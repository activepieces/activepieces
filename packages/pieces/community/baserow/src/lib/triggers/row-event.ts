import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { baserowJwtAuth } from '../auth';
import { baserowCommon, makeJwtClient } from '../common';

const STORE_KEY = 'baserow_row_event';

export const rowEventTrigger = createTrigger({
  name: 'baserow_row_event',
  auth: baserowJwtAuth,
  displayName: 'Row Event',
  description:
    'Triggers when a row is created, updated, or deleted in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    events: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description: 'Select which row events should trigger this flow.',
      required: true,
      defaultValue: ['rows.created', 'rows.updated', 'rows.deleted'],
      options: {
        disabled: false,
        options: [
          { label: 'Row Created', value: 'rows.created' },
          { label: 'Row Updated', value: 'rows.updated' },
          { label: 'Row Deleted', value: 'rows.deleted' },
        ],
      },
    }),
  },
  sampleData: {
    event_type: 'rows.updated',
    row: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Updated row',
      Status: 'Active',
    },
    previous_row: {
      id: 1,
      order: '1.00000000000000000000',
      Name: 'Original row',
      Status: 'Pending',
    },
  },
  async onEnable(context) {
    const tableId = context.propsValue.table_id;
    const selectedEvents = context.propsValue.events;
    if (!tableId || !selectedEvents || selectedEvents.length === 0) return;
    const client = await makeJwtClient(context.auth);
    const webhook = await client.createWebhook(
      tableId,
      context.webhookUrl,
      selectedEvents,
      `Activepieces – ${STORE_KEY}`
    );
    await context.store.put(STORE_KEY, { webhookId: webhook.id });
  },
  async onDisable(context) {
    const data = await context.store.get<{ webhookId: number }>(STORE_KEY);
    if (!data?.webhookId) return;
    const client = await makeJwtClient(context.auth);
    try {
      await client.deleteWebhook(data.webhookId);
    } catch {
      // Webhook may have been manually deleted in Baserow — ignore
    }
    await context.store.delete(STORE_KEY);
  },
  async run(context) {
    const body = context.payload.body as {
      event_type?: string;
      items?: unknown[];
      old_items?: unknown[];
    };

    const eventType = body.event_type ?? '';
    const items = body.items ?? [];
    const oldItems = body.old_items ?? [];

    if (eventType === 'rows.updated') {
      return items.map((row, i) => ({
        event_type: eventType,
        row,
        previous_row: oldItems[i] ?? null,
      }));
    }

    return items.map((row) => ({
      event_type: eventType,
      row,
    }));
  },
});

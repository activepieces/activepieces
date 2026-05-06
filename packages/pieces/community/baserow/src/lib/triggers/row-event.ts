import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { createWebhookTriggerHooks, dynamicWebhookInstructions } from '../common/webhook-trigger';

const triggerHooks = createWebhookTriggerHooks({
  events: ['rows.created', 'rows.updated', 'rows.deleted'],
  storeKey: 'baserow_row_event_trigger',
});

export const rowEventTrigger = createTrigger({
  name: 'baserow_row_event',
  auth: baserowAuth,
  displayName: 'Any Row Change',
  description:
    'Triggers when a row is created, updated, or deleted in a Baserow table. To react to only one event type, use the dedicated New Row, Updated Row, or Deleted Row triggers.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table_id: baserowCommon.tableId(),
    instructions: dynamicWebhookInstructions('Rows created, Rows updated, and Rows deleted'),
  },
  sampleData: {
    event_type: 'rows.created',
    row: { id: 1, order: '1.00000000000000000000', Name: 'Example row' },
    previous_row: null,
  },
  onEnable: triggerHooks.onEnable,
  onDisable: triggerHooks.onDisable,
  async run(context) {
    const body = context.payload.body as {
      event_type?: string;
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
      row_ids?: number[];
    };
    const eventType = body.event_type;
    if (eventType === 'rows.created') {
      return (body.items ?? []).map((row) => ({
        event_type: eventType,
        row,
        previous_row: null,
      }));
    }
    if (eventType === 'rows.updated') {
      return (body.items ?? []).map((row, i) => ({
        event_type: eventType,
        row,
        previous_row: (body.old_items ?? [])[i] ?? null,
      }));
    }
    if (eventType === 'rows.deleted') {
      return (body.row_ids ?? []).map((id) => ({
        event_type: eventType,
        row: { id },
        previous_row: null,
      }));
    }
    return [];
  },
  async test(context) {
    const tableId = context.propsValue.table_id;
    if (!tableId) return [];
    const client = await makeClient(context.auth);
    const response = await client.listRows(tableId, 1, 5);
    return response.results.map((row) => ({
      event_type: 'rows.created',
      row,
      previous_row: null,
    }));
  },
});

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaOrderTriggers } from './order-event-trigger';

export const orderStatusChangedTrigger = createTrigger({
  auth: sallaAuth,
  name: 'order_status_changed',
  displayName: 'Order Status Changed',
  description: 'Triggers when the status of an order changes in the Salla store, including custom statuses. Optionally only for the statuses you pick.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once each time an order in the connected Salla store moves to a new status (Salla event order.status.updated), optionally only when the new status is one of the selected statuses. One payload is the status history entry (new status name, note, time) with the full order nested under order.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    statuses: sallaProps.orderStatuses({
      required: false,
      displayName: 'Only These Statuses',
      description: 'Run the flow only when the order moves to one of these statuses. Leave empty to run on every status change.',
    }),
    rule: sallaProps.webhookRule(),
  },
  outputSchema: sallaOutputSchemas.orderStatusEvent,
  sampleData: sallaOrderTriggers.statusSample(),
  async onEnable(context) {
    await sallaOrderTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      webhookUrl: context.webhookUrl,
      rule: context.propsValue.rule,
    });
  },
  async onDisable(context) {
    await sallaOrderTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaOrderTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      payload: context.payload,
    });
    if (!event || !sallaOrderTriggers.matchesStatuses({ data: event.data, statuses: context.propsValue.statuses })) {
      return [];
    }
    return [sallaOrderTriggers.statusOutput(event)];
  },
  async test(context) {
    return sallaOrderTriggers.testStatusOutputs({ auth: context.auth, statuses: context.propsValue.statuses });
  },
});

const EVENT = 'order.status.updated';
const STORE_KEY = 'salla_order_status_changed';

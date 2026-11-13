import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaOrderTriggers } from './order-event-trigger';

export const orderUpdatedTrigger = createTrigger({
  auth: sallaAuth,
  name: 'order_updated',
  displayName: 'Order Updated',
  description: 'Triggers when an existing order changes in the Salla store, for example its items, address, payment or status.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires each time an existing order in the connected Salla store is changed (Salla event order.updated); one order can fire it many times. One payload is the order as it is after the change.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule(),
  },
  outputSchema: sallaOutputSchemas.orderEvent,
  sampleData: sallaOrderTriggers.orderSample({ event: 'order.updated' }),
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
    return event ? [sallaOrderTriggers.orderOutput(event)] : [];
  },
  async test(context) {
    return sallaOrderTriggers.testOrderOutputs({ auth: context.auth, event: EVENT });
  },
});

const EVENT = 'order.updated';
const STORE_KEY = 'salla_order_updated';

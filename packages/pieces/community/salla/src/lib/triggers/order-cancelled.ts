import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaOrderTriggers } from './order-event-trigger';

export const orderCancelledTrigger = createTrigger({
  auth: sallaAuth,
  name: 'order_cancelled',
  displayName: 'Order Cancelled',
  description: 'Triggers when an order is cancelled in the Salla store.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once when an order in the connected Salla store is cancelled (Salla event order.cancelled; the order status slug becomes canceled). One payload is the cancelled order.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule(),
  },
  outputSchema: sallaOutputSchemas.orderEvent,
  sampleData: sallaOrderTriggers.orderSample({ event: 'order.cancelled' }),
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

const EVENT = 'order.cancelled';
const STORE_KEY = 'salla_order_cancelled';

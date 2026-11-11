import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaOrderTriggers } from './order-event-trigger';

export const orderPaymentUpdatedTrigger = createTrigger({
  auth: sallaAuth,
  name: 'order_payment_updated',
  displayName: 'Order Payment Updated',
  description: 'Triggers when the payment of an order changes in the Salla store, for example when a bank transfer is confirmed or the payment method changes.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires when the payment of an order in the connected Salla store changes (Salla event order.payment.updated), such as a confirmed bank transfer or a new payment method. One payload is the order after the payment change.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule(),
  },
  outputSchema: sallaOutputSchemas.orderEvent,
  sampleData: sallaOrderTriggers.orderSample({ event: 'order.payment.updated' }),
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

const EVENT = 'order.payment.updated';
const STORE_KEY = 'salla_order_payment_updated';

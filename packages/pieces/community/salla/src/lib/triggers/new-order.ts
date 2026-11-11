import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaOrderTriggers } from './order-event-trigger';

export const newOrderTrigger = createTrigger({
  auth: sallaAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Triggers when a customer or the merchant places a new order in the Salla store.',
  classification: 'READ',
  aiMetadata: {
    description: 'Fires once for each new order created in the connected Salla store (Salla event order.created). One payload is the full order: ID, reference number, status, amounts, payment method and customer.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule(),
  },
  outputSchema: sallaOutputSchemas.orderEvent,
  sampleData: sallaOrderTriggers.orderSample({ event: 'order.created' }),
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

const EVENT = 'order.created';
const STORE_KEY = 'salla_new_order';

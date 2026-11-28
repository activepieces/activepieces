import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import {
  CART_ABANDONED_EVENT,
  CART_PURCHASED_EVENT,
  CART_RULE_DESCRIPTION,
  CartEvent,
  sallaStoreTriggers,
} from './store-event-trigger';

export const abandonedCartTrigger = createTrigger({
  auth: sallaAuth,
  name: 'abandoned_cart',
  displayName: 'Abandoned Cart',
  description:
    'Triggers when a shopper leaves items in a cart without paying (also when that cart changes later), or when an abandoned cart is recovered and paid.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires for the one cart event picked in Event. "Cart abandoned or changed" (Salla event abandoned.cart) fires when an abandoned cart is created and again each time it is updated, so the same cart can arrive more than once; its payload is the full cart: totals, checkout link, customer, coupon and items. "Cart recovered (purchased)" (Salla event abandoned.cart.purchased) fires once when the shopper completes the purchase; its payload is short: cart ID, status, currency, total, subtotal and discount only.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    event: Property.StaticDropdown<CartEvent, true>({
      displayName: 'Event',
      description:
        'Which cart event starts the flow. Salla sends "Cart abandoned or changed" when an abandoned cart is created and each time it is updated. To catch both events, use two flows.',
      required: true,
      defaultValue: CART_ABANDONED_EVENT,
      options: {
        options: [
          { label: 'Cart abandoned or changed', value: CART_ABANDONED_EVENT },
          { label: 'Cart recovered (purchased)', value: CART_PURCHASED_EVENT },
        ],
      },
    }),
    rule: sallaProps.webhookRule({ description: CART_RULE_DESCRIPTION }),
  },
  outputSchema: sallaOutputSchemas.abandonedCartEvent,
  sampleData: sallaStoreTriggers.cartSample({ event: CART_ABANDONED_EVENT }),
  async onEnable(context) {
    const event = sallaStoreTriggers.requireCartEvent(context.propsValue.event);
    await sallaStoreTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event,
      webhookUrl: context.webhookUrl,
      rule: sallaStoreTriggers.ruleFor({ event, rule: context.propsValue.rule }),
    });
  },
  async onDisable(context) {
    await sallaStoreTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaStoreTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: sallaStoreTriggers.requireCartEvent(context.propsValue.event),
      payload: context.payload,
    });
    return event ? [sallaStoreTriggers.eventOutput({ event, extras: sallaMarketing.withCartExtras })] : [];
  },
  async test(context) {
    return sallaStoreTriggers.testCartOutputs({
      auth: context.auth,
      event: sallaStoreTriggers.requireCartEvent(context.propsValue.event),
    });
  },
});

const STORE_KEY = 'salla_abandoned_cart';

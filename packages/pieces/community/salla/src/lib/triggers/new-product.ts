import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaProductTriggers } from './product-event-trigger';

export const newProductTrigger = createTrigger({
  auth: sallaAuth,
  name: 'new_product',
  displayName: 'New Product',
  description: 'Triggers when a product is added to the Salla store.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new product created in the connected Salla store (Salla event product.created). One payload is the full product: ID, name, SKU, type, status, quantity, prices, images, categories, variants and options.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule({
      description:
        'Optional condition Salla checks before sending the event, so the flow only runs for matching products. Put text values in backticks. Examples: `price > 100` or ``status = `sale` AND quantity > 0``. Product fields you can use include id, sku, name, type, price, sale_price, quantity, status and is_available.',
    }),
  },
  outputSchema: sallaOutputSchemas.productEvent,
  sampleData: sallaProductTriggers.productSample({ event: 'product.created' }),
  async onEnable(context) {
    await sallaProductTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      webhookUrl: context.webhookUrl,
      rule: context.propsValue.rule,
    });
  },
  async onDisable(context) {
    await sallaProductTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaProductTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      payload: context.payload,
    });
    return event ? [sallaProductTriggers.productOutput(event)] : [];
  },
  async test(context) {
    return sallaProductTriggers.testProductOutputs({ auth: context.auth, event: EVENT });
  },
});

const EVENT = 'product.created';
const STORE_KEY = 'salla_new_product';

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { PRODUCT_LOW_STOCK_EVENT, sallaProductTriggers } from './product-event-trigger';

export const productLowStockTrigger = createTrigger({
  auth: sallaAuth,
  name: 'product_low_stock',
  displayName: 'Product Low Stock',
  description: "Triggers when a product's stock drops to its low-stock alert level in the Salla store.",
  classification: 'READ',
  aiMetadata: {
    description:
      "Fires once each time a product in the connected Salla store reaches its low-stock level (Salla event product.quantity.low). The level is the product's low-stock alert quantity set in Salla. One payload is the full product, including the quantity left (quantity) and the alert level (notify_quantity).",
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule({
      description:
        'Optional condition Salla checks before sending the event, so the flow only runs for matching products. Put text values in backticks. Examples: `quantity < 5` or ``sku = `TSHIRT-RED-M` ``. Product fields you can use include id, sku, name, type, price, quantity, status and is_available.',
    }),
  },
  outputSchema: sallaOutputSchemas.lowStockEvent,
  sampleData: sallaProductTriggers.lowStockSample(),
  async onEnable(context) {
    await sallaProductTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: PRODUCT_LOW_STOCK_EVENT,
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
      event: PRODUCT_LOW_STOCK_EVENT,
      payload: context.payload,
    });
    return event ? [sallaProductTriggers.productOutput(event)] : [];
  },
  async test(context) {
    return sallaProductTriggers.testLowStockOutputs({ auth: context.auth });
  },
});

const STORE_KEY = 'salla_product_low_stock';

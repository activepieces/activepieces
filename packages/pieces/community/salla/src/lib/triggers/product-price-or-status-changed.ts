import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import {
  PRODUCT_PRICE_UPDATED_EVENT,
  PRODUCT_STATUS_UPDATED_EVENT,
  PriceStatusEvent,
  sallaProductTriggers,
} from './product-event-trigger';

export const productPriceOrStatusChangedTrigger = createTrigger({
  auth: sallaAuth,
  name: 'product_price_or_status_changed',
  displayName: 'Product Price or Status Changed',
  description:
    "Triggers when a product's price or its status (on sale, out of stock, hidden) changes in the Salla store. Replaces Salla's old \"product updated\" event, which Salla has retired.",
  classification: 'READ',
  aiMetadata: {
    description:
      "Fires once each time a product in the connected Salla store changes, for the one change type picked in Change: price (Salla event product.price.updated, covering regular price, sale price, cost and tax) or status (Salla event product.status.updated: sale, out or hidden). One payload is a short product record, not the full product: ID, SKU, MPN and GTIN, plus the new prices for a price change or the new status for a status change. Use Get Product with the ID for the rest.",
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    event: Property.StaticDropdown<PriceStatusEvent, true>({
      displayName: 'Change',
      description: 'Which change starts the flow. To catch both, use two flows.',
      required: true,
      defaultValue: PRODUCT_PRICE_UPDATED_EVENT,
      options: {
        options: [
          { label: 'Price changed', value: PRODUCT_PRICE_UPDATED_EVENT },
          { label: 'Status changed', value: PRODUCT_STATUS_UPDATED_EVENT },
        ],
      },
    }),
  },
  outputSchema: sallaOutputSchemas.productPriceStatusEvent,
  sampleData: sallaProductTriggers.priceStatusSample({ event: PRODUCT_PRICE_UPDATED_EVENT }),
  async onEnable(context) {
    await sallaProductTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: sallaProductTriggers.requirePriceStatusEvent(context.propsValue.event),
      webhookUrl: context.webhookUrl,
      rule: undefined,
    });
  },
  async onDisable(context) {
    await sallaProductTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaProductTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: sallaProductTriggers.requirePriceStatusEvent(context.propsValue.event),
      payload: context.payload,
    });
    return event ? [sallaProductTriggers.productOutput(event)] : [];
  },
  async test(context) {
    return sallaProductTriggers.testPriceStatusOutputs({
      auth: context.auth,
      event: sallaProductTriggers.requirePriceStatusEvent(context.propsValue.event),
    });
  },
});

const STORE_KEY = 'salla_product_price_or_status_changed';

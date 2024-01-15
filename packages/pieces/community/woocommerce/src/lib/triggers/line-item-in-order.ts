import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wooCommon } from '../common';
import { wooAuth } from '../..';

export const lineItemInOrder = createTrigger({
  name: 'lineItemInOrder',
  displayName: 'Line Item in Order',
  description:
    'Triggers on any Order event, returns line items from the Order.',
  type: TriggerStrategy.WEBHOOK,
  auth: wooAuth,
  props: {},
  //Create the webhooks in WooCommerce and save the webhook IDs in store for disable behavior
  async onEnable(context) {
    const webhookIds = await wooCommon.subscribeWebhook(
      context.webhookUrl,
      'Order',
      context.auth
    );

    await context.store?.put('_line_item_in_order_trigger', {
      webhookIds: webhookIds,
    });
  },
  //Delete the webhooks from WooCommerce
  async onDisable(context) {
    const response = (await context.store?.get(
      '_line_item_in_order_trigger'
    )) as { webhookIds: number[] };
    if (response !== null && response !== undefined) {
      response.webhookIds.forEach(async (webhookId: number) => {
        wooCommon.unsubscribeWebhook(webhookId, context.auth);
      });
    }
  },
  //Return order data
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;
    return [payloadBody.line_items];
  },

  sampleData: {
    id: 9,
    sku: '',
    name: 'First Product',
    image: {
      id: '',
      src: '',
    },
    price: 1,
    taxes: [],
    total: '2.000',
    quantity: 2,
    subtotal: '2.000',
    meta_data: [],
    tax_class: '',
    total_tax: '0.000',
    product_id: 12,
    parent_name: null,
    subtotal_tax: '0.000',
    variation_id: 0,
  },
});

type PayloadBody = {
  line_items: unknown[];
};

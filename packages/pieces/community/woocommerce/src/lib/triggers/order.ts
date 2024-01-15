import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wooCommon } from '../common';
import { wooAuth } from '../..';

export const order = createTrigger({
  name: 'order',
  displayName: 'Order',
  description: 'Triggers when any order is created, updated or deleted.',
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

    await context.store?.put('_order_trigger', {
      webhookIds: webhookIds,
    });
  },
  //Delete the webhooks from WooCommerce
  async onDisable(context) {
    const response = (await context.store?.get('_order_trigger')) as {
      webhookIds: number[];
    };
    if (response !== null && response !== undefined) {
      response.webhookIds.forEach(async (webhookId: number) => {
        wooCommon.unsubscribeWebhook(webhookId, context.auth);
      });
    }
  },
  //Return order data
  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    id: 17,
    total: '2.000',
    _links: {
      self: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/orders/17',
        },
      ],
      customer: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/customers/1',
        },
      ],
      collection: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/orders',
        },
      ],
    },
    number: '17',
    status: 'pending',
    shipping_total: '0.000',
    currency_symbol: '$',
    date_created_gmt: '2023-07-06T14:17:03',
    payment_method_title: 'Cash on delivery',
    billing: {
      city: 'City',
      email: 'email@gmail.com',
      phone: '123123123',
      state: 'State',
      company: '',
      country: 'CO',
      postcode: '11111',
      address_1: '1 Street',
      address_2: '',
      last_name: 'Last',
      first_name: 'First',
    },
    refunds: [],
    version: '7.8.2',
    cart_tax: '0.000',
    currency: 'USD',
    shipping: {
      city: 'City',
      phone: '',
      state: 'State',
      company: '',
      country: 'CO',
      postcode: '11111',
      address_1: '1 Street',
      address_2: '',
      last_name: 'Last',
      first_name: 'First',
    },
    date_paid: null,
    fee_lines: [],
    meta_data: [
      {
        id: 228,
        key: 'is_vat_exempt',
        value: 'no',
      },
    ],
    order_key: 'wc_order_C66uDC3RekAax',
    parent_id: 0,
    tax_lines: [],
    total_tax: '0.000',
    line_items: [
      {
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
    ],
    created_via: 'checkout',
    customer_id: 1,
    is_editable: false,
    payment_url:
      'https://myshop.com/?page_id=8&order-pay=17&pay_for_order=true&key=wc_order_C66uDC3RekAax',
    coupon_lines: [],
    date_created: '2023-07-06T14:17:03',
    discount_tax: '0.000',
    shipping_tax: '0.000',
    customer_note: '',
    date_modified: '2023-07-06T14:25:02',
    date_paid_gmt: null,
    needs_payment: true,
    date_completed: null,
    discount_total: '0.000',
    payment_method: 'cod',
    shipping_lines: [
      {
        id: 10,
        taxes: [],
        total: '0.000',
        meta_data: [
          {
            id: 75,
            key: 'Items',
            value: 'First Product × 2',
            display_key: 'Items',
            display_value: 'First Product × 2',
          },
        ],
        method_id: 'free_shipping',
        total_tax: '0.000',
        instance_id: '1',
        method_title: 'Free shipping',
      },
    ],
    transaction_id: '',
    needs_processing: true,
    date_modified_gmt: '2023-07-06T14:25:02',
    prices_include_tax: false,
  },
});

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const mailChimpNewOrderTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Fires when a new order is created in a connected store.',
  type: TriggerStrategy.POLLING,
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
  },
  sampleData: {
    id: 'order123',
    customer: {
      id: 'customer123',
      email_address: 'customer@example.com',
      opt_in_status: true,
      first_name: 'John',
      last_name: 'Doe',
    },
    campaign_id: '42694e9e57',
    landing_site: 'https://example.com',
    financial_status: 'paid',
    fulfillment_status: 'shipped',
    currency_code: 'USD',
    order_total: 100.00,
    order_url: 'https://example.com/orders/123',
    discount_total: 0,
    tax_total: 8.25,
    shipping_total: 5.00,
    tracking_code: 'prec',
    processed_at_foreign: '2009-03-26T21:35:57+00:00',
    cancelled_at_foreign: null,
    updated_at_foreign: '2009-03-26T21:35:57+00:00',
    shipping_address: {
      name: 'John Doe',
      address1: '123 Main St',
      city: 'Anytown',
      province: 'State',
      postal_code: '12345',
      country: 'US',
    },
    billing_address: {
      name: 'John Doe',
      address1: '123 Main St',
      city: 'Anytown',
      province: 'State',
      postal_code: '12345',
      country: 'US',
    },
    lines: [
      {
        id: 'line123',
        product_id: 'product123',
        product_title: 'Sample Product',
        product_variant_id: 'variant123',
        product_variant_title: 'Red',
        quantity: 2,
        price: 50.00,
      },
    ],
  },

  async onEnable(context): Promise<void> {
    await context.store?.put('last_check', new Date().toISOString());
  },

  async onDisable(context): Promise<void> {
    await context.store?.delete('last_check');
  },

  async run(context): Promise<unknown[]> {
    const lastCheck = await context.store?.get<string>('last_check');
    const storeId = context.propsValue.store_id!;

    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/ecommerce/stores/${storeId}/orders`
      );

      const orders = response.body.orders || [];
      const newOrders = lastCheck 
        ? orders.filter((order: any) => new Date(order.processed_at_foreign) > new Date(lastCheck))
        : orders;

      await context.store?.put('last_check', new Date().toISOString());

      return newOrders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },
});

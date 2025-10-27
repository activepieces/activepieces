import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const cartCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'cart_created',
  displayName: 'Cart Created',
  description: 'Triggers when a new cart is created',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new carts (minimum: 5 minutes)',
      required: false,
      defaultValue: 15,
    }),
  },
  sampleData: {
    id: 'abc123',
    customer_id: 456,
    email: 'customer@example.com',
    cart_amount: 99.99,
    currency: { code: 'USD' },
    created_time: '2024-01-01T12:00:00Z',
    line_items: {
      physical_items: [
        {
          id: 'item123',
          product_id: 789,
          name: 'Sample Product',
          quantity: 1,
          list_price: 99.99,
        },
      ],
    },
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 15, 5);

    try {
      const lastCheckTime = await context.store?.get('lastCheckTime') as string;
      const now = new Date();
      
      const checkFromTime = lastCheckTime
        ? new Date(new Date(lastCheckTime).getTime() - (finalPollingInterval * 60 * 1000))
        : new Date(now.getTime() - (finalPollingInterval * 60 * 1000));

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/carts',
        method: HttpMethod.GET,
        queryParams: {
          limit: '50',
        },
      });

      const carts = (response.body as { data: any[] }).data || [];

      const newCarts = carts.filter((cart: any) => {
        if (!cart.created_time) return false;
        const createdTime = new Date(cart.created_time);
        return createdTime > checkFromTime;
      });

      await context.store?.put('lastCheckTime', now.toISOString());

      return newCarts.map(cart => ({
        ...cart,
        detectedAt: now.toISOString(),
      }));
    } catch (error) {
      console.error('Error polling for new carts:', error);
      return [];
    }
  },
});
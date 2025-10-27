import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const abandonedCart = createTrigger({
  auth: bigcommerceAuth,
  name: 'abandoned_cart',
  displayName: 'Abandoned Cart',
  description: 'Triggers when a cart is abandoned (no activity for specified time)',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for abandoned carts (minimum: 15 minutes)',
      required: false,
      defaultValue: 60,
    }),
    abandonedThreshold: Property.Number({
      displayName: 'Abandoned Threshold (hours)',
      description: 'Hours of inactivity before cart is considered abandoned',
      required: false,
      defaultValue: 24,
    }),
  },
  sampleData: {
    id: 'abc123',
    customer_id: 456,
    email: 'customer@example.com',
    cart_amount: 99.99,
    currency: { code: 'USD' },
    created_time: '2024-01-01T12:00:00Z',
    updated_time: '2024-01-01T12:00:00Z',
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
    const { pollingInterval, abandonedThreshold } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 60, 15);
    const finalAbandonedThreshold = abandonedThreshold || 24;

    try {
      const now = new Date();
      const abandonedTime = new Date(now.getTime() - (finalAbandonedThreshold * 60 * 60 * 1000));

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/carts',
        method: HttpMethod.GET,
        queryParams: {
          limit: '50',
        },
      });

      const carts = (response.body as { data: any[] }).data || [];

      const abandonedCarts = carts.filter((cart: any) => {
        if (!cart.updated_time) return false;
        const lastUpdate = new Date(cart.updated_time);
        return lastUpdate < abandonedTime;
      });

      await context.store?.put('lastCheckTime', now.toISOString());

      return abandonedCarts.map(cart => ({
        ...cart,
        detectedAt: now.toISOString(),
        abandonedFor: Math.floor((now.getTime() - new Date(cart.updated_time).getTime()) / (1000 * 60 * 60)),
      }));
    } catch (error) {
      console.error('Error polling for abandoned carts:', error);
      return [];
    }
  },
});
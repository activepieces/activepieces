import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const orderCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'order_created',
  displayName: 'Order Created',
  description: 'Triggers when a new order is created',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new orders (minimum: 5 minutes)',
      required: false,
      defaultValue: 15,
    }),
  },
  sampleData: {
    id: 123,
    customer_id: 456,
    date_created: '2024-01-01T12:00:00Z',
    status: 'Pending',
    total_inc_tax: '99.99',
    currency_code: 'USD',
    billing_address: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
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

      const queryParams: Record<string, string> = {
        limit: '50',
        sort: 'date_created:desc',
      };

      if (lastCheckTime) {
        queryParams['min_date_created'] = checkFromTime.toISOString().split('.')[0] + 'Z';
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/orders',
        method: HttpMethod.GET,
        queryParams,
      });

      const orders = (response.body as { data: any[] }).data || [];

      await context.store?.put('lastCheckTime', now.toISOString());

      return orders.map(order => ({
        ...order,
        detectedAt: now.toISOString(),
      }));
    } catch (error) {
      console.error('Error polling for new orders:', error);
      return [];
    }
  },
});
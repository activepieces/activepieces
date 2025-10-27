import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const orderStatusUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'order_status_updated',
  displayName: 'Order Status Updated',
  description: 'Triggers when an order status has changed',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for order status changes (minimum: 5 minutes)',
      required: false,
      defaultValue: 15,
    }),
    statusFilter: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Only trigger for specific status changes (optional)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'All Status Changes', value: 'all' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Awaiting Payment', value: 'Awaiting Payment' },
          { label: 'Awaiting Fulfillment', value: 'Awaiting Fulfillment' },
          { label: 'Awaiting Shipment', value: 'Awaiting Shipment' },
          { label: 'Awaiting Pickup', value: 'Awaiting Pickup' },
          { label: 'Partially Shipped', value: 'Partially Shipped' },
          { label: 'Shipped', value: 'Shipped' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Cancelled', value: 'Cancelled' },
          { label: 'Declined', value: 'Declined' },
          { label: 'Refunded', value: 'Refunded' },
        ],
      },
    }),
  },
  sampleData: {
    id: 123,
    customer_id: 456,
    date_created: '2024-01-01T12:00:00Z',
    date_modified: '2024-01-02T12:00:00Z',
    status: 'Shipped',
    previous_status: 'Awaiting Shipment',
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
    await context.store?.put('orderStatuses', JSON.stringify({}));
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
    await context.store?.delete('orderStatuses');
  },
  async run(context) {
    const { pollingInterval, statusFilter } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 15, 5);

    try {
      const orderStatusesStr = await context.store?.get('orderStatuses') as string;
      const previousStatuses = orderStatusesStr ? JSON.parse(orderStatusesStr) : {};

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/orders',
        method: HttpMethod.GET,
        queryParams: {
          limit: '100',
          sort: 'date_modified:desc',
        },
      });

      const orders = (response.body as { data: any[] }).data || [];
      const statusChangedOrders: any[] = [];
      const currentStatuses: Record<string, string> = {};

      for (const order of orders) {
        const orderId = order.id.toString();
        const currentStatus = order.status;
        const previousStatus = previousStatuses[orderId];

        currentStatuses[orderId] = currentStatus;

        if (previousStatus && previousStatus !== currentStatus) {
          if (!statusFilter || statusFilter === 'all' || currentStatus === statusFilter) {
            statusChangedOrders.push({
              ...order,
              previous_status: previousStatus,
              detectedAt: new Date().toISOString(),
            });
          }
        }
      }

      await context.store?.put('orderStatuses', JSON.stringify(currentStatuses));
      await context.store?.put('lastCheckTime', new Date().toISOString());

      return statusChangedOrders;
    } catch (error) {
      console.error('Error polling for order status changes:', error);
      return [];
    }
  },
});
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const orderStatusUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'order_status_updated',
  displayName: 'Order Status Updated',
  description: 'Triggers when an order status has changed via BigCommerce webhook',
  type: TriggerStrategy.WEBHOOK,
  props: {
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
    scope: 'store/order/statusUpdated',
    store_id: '1025646',
    data: {
      type: 'order',
      id: 250,
      orderId: 250,
      status: {
        previous_status_id: 7,
        new_status_id: 10,
      },
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for order status updated events
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/order/statusUpdated',
          destination: webhookUrl,
          is_active: true,
          headers: {},
        },
      });

      const webhookData = (webhook.body as { data: any }).data;
      await context.store?.put('webhookId', webhookData.id.toString());
      
      console.log(`BigCommerce webhook created with ID: ${webhookData.id}`);
    } catch (error) {
      console.error('Failed to create BigCommerce webhook:', error);
      throw handleBigCommerceError(error, 'Failed to create webhook for order status updated events');
    }
  },
  
  async onDisable(context) {
    const webhookId = await context.store?.get('webhookId');
    
    if (webhookId) {
      try {
        await sendBigCommerceRequest({
          auth: context.auth,
          url: `/hooks/${webhookId}`,
          method: HttpMethod.DELETE,
        });
        
        await context.store?.delete('webhookId');
        console.log(`BigCommerce webhook ${webhookId} deleted`);
      } catch (error) {
        console.error('Failed to delete BigCommerce webhook:', error);
      }
    }
  },
  
  async run(context) {
    const payload = context.payload.body as any;
    const { statusFilter } = context.propsValue;
    
    // Validate webhook payload
    if (!payload || payload.scope !== 'store/order/statusUpdated') {
      return [];
    }

    try {
      // Fetch the full order details using the order ID from webhook
      const orderId = payload.data?.id || payload.data?.orderId;
      
      if (!orderId) {
        console.error('No order ID found in webhook payload');
        return [];
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/orders/${orderId}`,
        method: HttpMethod.GET,
      });

      const order = (response.body as { data: any }).data;

      // Apply status filter if specified
      if (statusFilter && statusFilter !== 'all' && order.status !== statusFilter) {
        return [];
      }

      return [{
        ...order,
        webhook_payload: payload,
        previous_status_id: payload.data?.status?.previous_status_id,
        new_status_id: payload.data?.status?.new_status_id,
        triggered_at: new Date().toISOString(),
      }];
    } catch (error) {
      console.error('Error fetching order details:', error);
      return [];
    }
  },
});
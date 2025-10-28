import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const orderUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'order_updated',
  displayName: 'Order Updated',
  description: 'Triggers when an order is updated via BigCommerce webhook',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/order/updated',
    store_id: '1025646',
    data: {
      type: 'order',
      id: 250,
      orderId: 250,
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for order updated events
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/order/updated',
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
      throw handleBigCommerceError(error, 'Failed to create webhook for order updated events');
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
    
    // Validate webhook payload
    if (!payload || payload.scope !== 'store/order/updated') {
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

      return [{
        ...order,
        webhook_payload: payload,
        triggered_at: new Date().toISOString(),
      }];
    } catch (error) {
      console.error('Error fetching order details:', error);
      return [];
    }
  },
});
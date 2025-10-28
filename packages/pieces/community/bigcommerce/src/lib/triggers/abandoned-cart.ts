import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const abandonedCart = createTrigger({
  auth: bigcommerceAuth,
  name: 'abandoned_cart',
  displayName: 'Abandoned Cart',
  description: 'Triggers when a cart is abandoned via BigCommerce webhook',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/cart/abandoned',
    store_id: '1025646',
    data: {
      type: 'cart',
      id: 'abc123',
      cartId: 'abc123',
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for cart abandoned events
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/cart/abandoned',
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
      throw handleBigCommerceError(error, 'Failed to create webhook for cart abandoned events');
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
    if (!payload || payload.scope !== 'store/cart/abandoned') {
      return [];
    }

    try {
      // Fetch the full cart details using the cart ID from webhook
      const cartId = payload.data?.id || payload.data?.cartId;
      
      if (!cartId) {
        console.error('No cart ID found in webhook payload');
        return [];
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/carts/${cartId}`,
        method: HttpMethod.GET,
      });

      const cart = (response.body as { data: any }).data;

      return [{
        ...cart,
        webhook_payload: payload,
        triggered_at: new Date().toISOString(),
        abandoned_at: new Date(payload.created_at * 1000).toISOString(),
      }];
    } catch (error) {
      console.error('Error fetching cart details:', error);
      return [];
    }
  },
});
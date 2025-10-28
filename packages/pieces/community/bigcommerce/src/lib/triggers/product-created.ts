import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const productCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'product_created',
  displayName: 'Product Created',
  description: 'Triggers when a new product is created via BigCommerce webhook',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/product/created',
    store_id: '1025646',
    data: {
      type: 'product',
      id: 206,
      productId: 206,
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for product created events
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/product/created',
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
      throw handleBigCommerceError(error, 'Failed to create webhook for product created events');
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
    if (!payload || payload.scope !== 'store/product/created') {
      return [];
    }

    try {
      // Fetch the full product details using the product ID from webhook
      const productId = payload.data?.id || payload.data?.productId;
      
      if (!productId) {
        console.error('No product ID found in webhook payload');
        return [];
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/catalog/products/${productId}`,
        method: HttpMethod.GET,
      });

      const product = (response.body as { data: any }).data;

      return [{
        ...product,
        webhook_payload: payload,
        triggered_at: new Date().toISOString(),
      }];
    } catch (error) {
      console.error('Error fetching product details:', error);
      return [];
    }
  },
});
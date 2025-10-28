import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_created',
  displayName: 'Customer Created',
  description: 'Triggers when a new customer is created via BigCommerce webhook',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/customer/created',
    store_id: '1025646',
    data: {
      type: 'customer',
      id: 60,
      customerId: 60,
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    try {
      // Create webhook for customer created events
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/customer/created',
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
      throw handleBigCommerceError(error, 'Failed to create webhook for customer created events');
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
    if (!payload || payload.scope !== 'store/customer/created') {
      return [];
    }

    try {
      // Fetch the full customer details using the customer ID from webhook
      const customerId = payload.data?.id || payload.data?.customerId;

      if (!customerId) {
        console.error('No customer ID found in webhook payload');
        return [];
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}`,
        method: HttpMethod.GET,
      });

      const customer = (response.body as { data: any }).data;

      return [{
        ...customer,
        webhook_payload: payload,
        triggered_at: new Date().toISOString(),
      }];
    } catch (error) {
      console.error('Error fetching customer details:', error);
      return [];
    }
  },
});
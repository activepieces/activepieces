import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerAddressUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_address_updated',
  displayName: 'Customer Address Updated',
  description: 'Triggers when a customer address is updated via BigCommerce webhook (monitors customer updates)',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/customer/updated',
    store_id: '1025646',
    data: {
      type: 'customer',
      id: 60,
      customerId: 60,
    },
    hash: 'a8b4e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3e3',
    created_at: 1561479335,
    producer: 'stores/abcde',
    address_data: {
      id: 123,
      customer_id: 60,
      address1: '123 Main St',
      city: 'New York',
      date_modified: '2024-01-02T12:00:00Z',
    },
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for customer updated events (to detect address updates)
      const webhook = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/hooks',
        method: HttpMethod.POST,
        body: {
          scope: 'store/customer/updated',
          destination: webhookUrl,
          is_active: true,
          headers: {},
        },
      });

      const webhookData = (webhook.body as { data: any }).data;
      await context.store?.put('webhookId', webhookData.id.toString());
      await context.store?.put('addressModificationTimes', JSON.stringify({}));
      
      console.log(`BigCommerce webhook created with ID: ${webhookData.id}`);
    } catch (error) {
      console.error('Failed to create BigCommerce webhook:', error);
      throw handleBigCommerceError(error, 'Failed to create webhook for customer address updates');
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
        await context.store?.delete('addressModificationTimes');
        console.log(`BigCommerce webhook ${webhookId} deleted`);
      } catch (error) {
        console.error('Failed to delete BigCommerce webhook:', error);
      }
    }
  },
  
  async run(context) {
    const payload = context.payload.body as any;
    
    // Validate webhook payload
    if (!payload || payload.scope !== 'store/customer/updated') {
      return [];
    }

    try {
      const customerId = payload.data?.id || payload.data?.customerId;
      
      if (!customerId) {
        console.error('No customer ID found in webhook payload');
        return [];
      }

      // Check for updated addresses on this customer
      const addressesResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.GET,
      });

      const addresses = (addressesResponse.body as { data: any[] }).data || [];
      
      if (addresses.length === 0) {
        return [];
      }

      // Get known modification times from storage
      const addressModificationTimesStr = await context.store?.get('addressModificationTimes') as string;
      const previousModificationTimes = addressModificationTimesStr ? JSON.parse(addressModificationTimesStr) : {};
      const currentModificationTimes: Record<string, string> = {};
      const updatedAddresses: any[] = [];

      for (const address of addresses) {
        const addressKey = `${customerId}-${address.id}`;
        const currentModTime = address.date_modified || address.date_created;
        const previousModTime = previousModificationTimes[addressKey];

        currentModificationTimes[addressKey] = currentModTime;

        // Check if address was modified (not just created)
        if (previousModTime && currentModTime && 
            new Date(currentModTime) > new Date(previousModTime) &&
            address.date_modified && address.date_created &&
            new Date(address.date_modified) > new Date(address.date_created)) {
          
          updatedAddresses.push({
            ...address,
            customer_id: customerId,
            previous_modification_time: previousModTime,
            webhook_payload: payload,
            triggered_at: new Date().toISOString(),
          });
        }
      }

      // Update stored modification times
      await context.store?.put('addressModificationTimes', JSON.stringify({
        ...previousModificationTimes,
        ...currentModificationTimes,
      }));

      return updatedAddresses;
    } catch (error) {
      console.error('Error processing customer address update webhook:', error);
      return [];
    }
  },
});
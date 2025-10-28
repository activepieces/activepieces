import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerAddressCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_address_created',
  displayName: 'Customer Address Created',
  description: 'Triggers when a new customer address is created via BigCommerce webhook (monitors customer updates)',
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
    },
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    try {
      // Create webhook for customer updated events (to detect new addresses)
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
      await context.store?.put('knownAddresses', JSON.stringify([]));
      
      console.log(`BigCommerce webhook created with ID: ${webhookData.id}`);
    } catch (error) {
      console.error('Failed to create BigCommerce webhook:', error);
      throw handleBigCommerceError(error, 'Failed to create webhook for customer address detection');
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
        await context.store?.delete('knownAddresses');
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

      // Check for new addresses on this customer
      const addressesResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: `/customers/${customerId}/addresses`,
        method: HttpMethod.GET,
      });

      const addresses = (addressesResponse.body as { data: any[] }).data || [];
      
      if (addresses.length === 0) {
        return [];
      }

      // Get known addresses from storage
      const knownAddressesStr = await context.store?.get('knownAddresses') as string;
      const knownAddresses = knownAddressesStr ? JSON.parse(knownAddressesStr) : [];
      const knownAddressIds = new Set(knownAddresses.map((addr: any) => `${addr.customer_id}-${addr.id}`));

      // Find new addresses
      const newAddresses = addresses.filter(address => 
        !knownAddressIds.has(`${customerId}-${address.id}`)
      );

      if (newAddresses.length > 0) {
        // Update known addresses
        const addressesWithCustomerId = newAddresses.map(addr => ({ ...addr, customer_id: customerId }));
        const allKnownAddresses = [...knownAddresses, ...addressesWithCustomerId];
        await context.store?.put('knownAddresses', JSON.stringify(allKnownAddresses.slice(-1000)));

        return addressesWithCustomerId.map(address => ({
          ...address,
          webhook_payload: payload,
          triggered_at: new Date().toISOString(),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error processing customer address webhook:', error);
      return [];
    }
  },
});
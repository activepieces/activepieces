import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerAddressCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_address_created',
  displayName: 'Customer Address Created',
  description: 'Triggers when a new customer address is created',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new customer addresses (minimum: 10 minutes)',
      required: false,
      defaultValue: 30,
    }),
  },
  sampleData: {
    id: 123,
    customer_id: 456,
    first_name: 'John',
    last_name: 'Doe',
    company: 'Example Corp',
    address1: '123 Main St',
    address2: 'Apt 4B',
    city: 'New York',
    state_or_province: 'NY',
    postal_code: '10001',
    country_code: 'US',
    phone: '+1234567890',
    address_type: 'residential',
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
    await context.store?.put('knownAddresses', JSON.stringify([]));
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
    await context.store?.delete('knownAddresses');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 30, 10);

    try {
      const knownAddressesStr = await context.store?.get('knownAddresses') as string;
      const knownAddresses = knownAddressesStr ? JSON.parse(knownAddressesStr) : [];
      const knownAddressIds = new Set(knownAddresses.map((addr: any) => `${addr.customer_id}-${addr.id}`));

      const customersResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams: { limit: '50' },
      });

      const customers = (customersResponse.body as { data: any[] }).data || [];
      const newAddresses: any[] = [];

      for (const customer of customers.slice(0, 10)) {
        try {
          const addressesResponse = await sendBigCommerceRequest({
            auth: context.auth,
            url: `/customers/${customer.id}/addresses`,
            method: HttpMethod.GET,
          });

          const addresses = (addressesResponse.body as { data: any[] }).data || [];
          
          for (const address of addresses) {
            const addressKey = `${customer.id}-${address.id}`;
            if (!knownAddressIds.has(addressKey)) {
              newAddresses.push({
                ...address,
                customer_id: customer.id,
                detectedAt: new Date().toISOString(),
              });
              knownAddressIds.add(addressKey);
            }
          }
        } catch (error) {
          console.error(`Error fetching addresses for customer ${customer.id}:`, error);
        }
      }

      const allKnownAddresses = [...knownAddresses, ...newAddresses];
      await context.store?.put('knownAddresses', JSON.stringify(allKnownAddresses.slice(-1000)));
      await context.store?.put('lastCheckTime', new Date().toISOString());

      return newAddresses;
    } catch (error) {
      console.error('Error polling for new customer addresses:', error);
      return [];
    }
  },
});
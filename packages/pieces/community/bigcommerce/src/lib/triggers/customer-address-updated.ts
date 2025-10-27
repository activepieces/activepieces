import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerAddressUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_address_updated',
  displayName: 'Customer Address Updated',
  description: 'Triggers when a customer address is updated',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for updated customer addresses (minimum: 10 minutes)',
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
    date_created: '2024-01-01T12:00:00Z',
    date_modified: '2024-01-02T12:00:00Z',
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
    await context.store?.put('addressModificationTimes', JSON.stringify({}));
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
    await context.store?.delete('addressModificationTimes');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 30, 10);

    try {
      const addressModificationTimesStr = await context.store?.get('addressModificationTimes') as string;
      const previousModificationTimes = addressModificationTimesStr ? JSON.parse(addressModificationTimesStr) : {};

      const customersResponse = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams: { limit: '50' },
      });

      const customers = (customersResponse.body as { data: any[] }).data || [];
      const updatedAddresses: any[] = [];
      const currentModificationTimes: Record<string, string> = {};

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
                customer_id: customer.id,
                detectedAt: new Date().toISOString(),
                previous_modification_time: previousModTime,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching addresses for customer ${customer.id}:`, error);
        }
      }

      await context.store?.put('addressModificationTimes', JSON.stringify(currentModificationTimes));
      await context.store?.put('lastCheckTime', new Date().toISOString());

      return updatedAddresses;
    } catch (error) {
      console.error('Error polling for updated customer addresses:', error);
      return [];
    }
  },
});
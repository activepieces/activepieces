import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const mailChimpNewCustomerTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is added to a connected store.',
  type: TriggerStrategy.POLLING,
  props: {
    store_id: mailchimpCommon.mailChimpStoreIdDropdown,
  },
  sampleData: {
    id: 'customer123',
    email_address: 'customer@example.com',
    opt_in_status: true,
    company: 'Example Company',
    first_name: 'John',
    last_name: 'Doe',
    orders_count: 0,
    total_spent: 0,
    address: {
      address1: '123 Main St',
      city: 'Anytown',
      province: 'State',
      postal_code: '12345',
      country: 'US',
    },
    created_at: '2009-03-26T21:35:57+00:00',
    updated_at: '2009-03-26T21:35:57+00:00',
  },

  async onEnable(context): Promise<void> {
    await context.store?.put('last_check', new Date().toISOString());
  },

  async onDisable(context): Promise<void> {
    await context.store?.delete('last_check');
  },

  async run(context): Promise<unknown[]> {
    const lastCheck = await context.store?.get<string>('last_check');
    const storeId = context.propsValue.store_id!;

    try {
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/ecommerce/stores/${storeId}/customers`
      );

      const customers = response.body.customers || [];
      const newCustomers = lastCheck 
        ? customers.filter((customer: any) => new Date(customer.created_at) > new Date(lastCheck))
        : customers;

      await context.store?.put('last_check', new Date().toISOString());

      return newCustomers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },
});

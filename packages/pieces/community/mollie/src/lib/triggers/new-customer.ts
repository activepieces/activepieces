import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const newCustomerTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is created in Mollie',
  props: {},
  sampleData: {
    resource: 'customer',
    id: 'cst_kEn1PlbGa',
    mode: 'live',
    createdAt: '2018-03-20T09:13:37+00:00',
    name: 'Customer A',
    email: 'customer@example.org',
    locale: 'nl_NL',
    metadata: {},
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/customers/cst_kEn1PlbGa',
        type: 'application/hal+json'
      }
    }
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store?.put('lastChecked', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store?.delete('lastChecked');
  },
    async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    try {
      const storedLastChecked = await context.store?.get('lastChecked');
      const lastChecked = typeof storedLastChecked === 'string' 
        ? storedLastChecked 
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await api.searchCustomers({
        limit: 250,
        from: lastChecked
      });
      
      const customers = (
        response && 
        typeof response === 'object' && 
        '_embedded' in response &&
        response._embedded &&
        typeof response._embedded === 'object' &&
        'customers' in response._embedded &&
        Array.isArray(response._embedded.customers)
      ) ? response._embedded.customers : [];
      
      const newCustomers = customers.filter((customer: any) => 
        customer.createdAt && new Date(customer.createdAt) > new Date(lastChecked)
      );
      
      if (customers.length > 0) {
        const latest = customers.reduce((prev: any, current: any) => 
          new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
        );
        await context.store?.put('lastChecked', latest.createdAt);
      }
      
      return newCustomers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },
});
import { createTrigger, TriggerStrategy, StoreScope, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { customerioAuth } from '../../..';

export const newCustomer = createTrigger({
  name: 'new_customer',
  auth: customerioAuth,
  displayName: 'New Customer',
  description: 'Triggers when a new customer is identified in Customer.io',
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable({ store }) {
    await store.put('lastChecked', Math.floor(Date.now() / 1000), StoreScope.FLOW);
  },
  async onDisable({ store }) {
    await store.delete('lastChecked', StoreScope.FLOW);
  },
  async run({ auth, store }) {
    const lastChecked = await store.get<number>('lastChecked', StoreScope.FLOW) || 0;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.customer.io/v1/customers?created_after=${lastChecked}&limit=50`,
      headers: { Authorization: `Bearer ${auth.app_api_key}` },
    });
    await store.put('lastChecked', Math.floor(Date.now() / 1000), StoreScope.FLOW);
    return (response.body as any)?.customers || [];
  },
  sampleData: { id: 'customer_123', email: 'user@example.com', created_at: 1700000000, attributes: {} },
});

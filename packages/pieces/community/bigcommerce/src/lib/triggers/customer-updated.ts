import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const customerUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_updated',
  displayName: 'Customer Updated',
  description: 'Triggers when a customer is updated',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for updated customers (minimum: 5 minutes)',
      required: false,
      defaultValue: 15,
    }),
  },
  sampleData: {
    id: 123,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    company: 'Example Corp',
    phone: '+1234567890',
    date_created: '2024-01-01T12:00:00Z',
    date_modified: '2024-01-02T12:00:00Z',
    customer_group_id: 0,
  },
  async onEnable(context) {
    const lastCheckTime = new Date().toISOString();
    await context.store?.put('lastCheckTime', lastCheckTime);
  },
  async onDisable(context) {
    await context.store?.delete('lastCheckTime');
  },
  async run(context) {
    const { pollingInterval } = context.propsValue;
    const finalPollingInterval = Math.max(pollingInterval || 15, 5);

    try {
      const lastCheckTime = await context.store?.get('lastCheckTime') as string;
      const now = new Date();
      
      const checkFromTime = lastCheckTime
        ? new Date(new Date(lastCheckTime).getTime() - (finalPollingInterval * 60 * 1000))
        : new Date(now.getTime() - (finalPollingInterval * 60 * 1000));

      const queryParams: Record<string, string> = {
        limit: '50',
        sort: 'date_modified:desc',
      };

      if (lastCheckTime) {
        queryParams['date_modified:min'] = checkFromTime.toISOString().split('.')[0] + 'Z';
      }

      const response = await sendBigCommerceRequest({
        auth: context.auth,
        url: '/customers',
        method: HttpMethod.GET,
        queryParams,
      });

      const customers = (response.body as { data: any[] }).data || [];

      const updatedCustomers = customers.filter((customer: any) => {
        if (!customer.date_modified || !customer.date_created) return false;
        const modifiedTime = new Date(customer.date_modified);
        const createdTime = new Date(customer.date_created);
        return modifiedTime > createdTime && modifiedTime > checkFromTime;
      });

      await context.store?.put('lastCheckTime', now.toISOString());

      return updatedCustomers.map(customer => ({
        ...customer,
        detectedAt: now.toISOString(),
      }));
    } catch (error) {
      console.error('Error polling for updated customers:', error);
      return [];
    }
  },
});
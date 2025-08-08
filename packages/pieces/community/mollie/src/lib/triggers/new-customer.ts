import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';

export const newCustomerTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is created in Mollie',
  props: {},
  sampleData: {
    id: 'cst_example123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2024-01-01T12:00:00+00:00',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
  },
  async onDisable() {
  },
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.id?.startsWith('evt_') && payload.type === 'customer.created') {
      return [payload.data];
    }
    
    return [];
  },
});
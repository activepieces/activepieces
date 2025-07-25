import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';

const WEBHOOK_KEY = 'helpscout_new_customer_webhook_id';

export const newCustomer = createTrigger({
  auth: helpScoutAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Fires when a new customer is added in Help Scout.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 654321,
    email: 'customer@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00Z',
  },
  async onEnable(context: any) {
    const response = await fetch('https://api.helpscout.net/v2/webhooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: context.webhookUrl,
        events: ['customer.created'],
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to register Help Scout webhook');
    }
    const data = await response.json();
    await context.store.put(WEBHOOK_KEY, data.id);
  },
  async onDisable(context: any) {
    const webhookId = await context.store.get(WEBHOOK_KEY);
    if (webhookId) {
      await fetch(`https://api.helpscout.net/v2/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete(WEBHOOK_KEY);
    }
  },
  async run(context: any): Promise<any[]> {
    return [context.payload.body];
  },
}); 
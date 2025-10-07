import {
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import { simplybookAuth, SimplybookAuth, subscribeWebhook } from '../common';

export const newClient = createTrigger({
  auth: simplybookAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggers when a new client is added (via booking or manually) in SimplyBook.me',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const auth = context.auth as SimplybookAuth;
    await subscribeWebhook(auth, context.webhookUrl, 'new_client');
    await context.store.put('webhook_registered', true);
  },
  async onDisable(context) {
    await context.store.delete('webhook_registered');
  },
  async run(context) {
    const body = context.payload.body as any;
    return [body];
  },
  sampleData: {
    id: 12345,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    zip: '10001',
    country: 'USA',
    created_at: '2025-10-05T10:30:00.000Z'
  }
});

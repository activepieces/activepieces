import {
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import { simplybookAuth, SimplybookAuth, subscribeWebhook } from '../common';

export const newBooking = createTrigger({
  auth: simplybookAuth,
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new booking is created in SimplyBook.me',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const auth = context.auth as SimplybookAuth;
    await subscribeWebhook(auth, context.webhookUrl, 'create');
    await context.store.put('webhook_registered', true);
  },
  async onDisable(context) {
    // Note: SimplyBook.me doesn't provide an unsubscribe method
    // The webhook will need to be manually removed from the dashboard if needed
    await context.store.delete('webhook_registered');
  },
  async run(context) {
    const body = context.payload.body as any;
    return [body];
  },
  sampleData: {
    id: 123456,
    code: 'abc123xyz',
    is_confirmed: true,
    start_datetime: '2025-10-05 14:00:00',
    end_datetime: '2025-10-05 15:00:00',
    location_id: 1,
    category_id: 2,
    service_id: 3,
    provider_id: 4,
    client_id: 5,
    duration: 60,
    service: {
      id: 3,
      name: 'Consultation',
      description: 'Initial consultation',
      price: 100.0,
      currency: 'USD',
      duration: 60
    },
    provider: {
      id: 4,
      name: 'John Smith',
      email: 'john@example.com'
    },
    location: {
      id: 1,
      name: 'Main Office'
    },
    category: {
      id: 2,
      name: 'Medical Services'
    }
  }
});

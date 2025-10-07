import {
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import { simplybookAuth, SimplybookAuth, subscribeWebhook } from '../common';

export const bookingCanceled = createTrigger({
  auth: simplybookAuth,
  name: 'booking_canceled',
  displayName: 'Booking Cancellation',
  description: 'Triggers when a booking is canceled in SimplyBook.me',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const auth = context.auth as SimplybookAuth;
    await subscribeWebhook(auth, context.webhookUrl, 'cancel');
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
    id: 123456,
    code: 'abc123xyz',
    is_confirmed: false,
    start_datetime: '2025-10-05 14:00:00',
    end_datetime: '2025-10-05 15:00:00',
    location_id: 1,
    category_id: 2,
    service_id: 3,
    provider_id: 4,
    client_id: 5,
    duration: 60,
    status: 'canceled',
    invoice_status: 'cancelled',
    can_be_edited: false,
    can_be_canceled: false,
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
    },
    client: {
      id: 5,
      name: 'Jane Customer',
      email: 'jane@customer.com',
      phone: '+1234567890'
    },
    comment: 'Customer requested cancellation',
    cancellation_info: {
      previous_status: 'confirmed',
      canceled_at: '2025-10-05T10:30:00.000Z'
    }
  }
});

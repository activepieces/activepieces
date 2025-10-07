import {
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import { simplybookAuth, SimplybookAuth, subscribeWebhook } from '../common';

export const bookingChanged = createTrigger({
  auth: simplybookAuth,
  name: 'booking_changed',
  displayName: 'Booking Change',
  description:
    'Triggers when booking details change (date, time, service, provider, status, intake form answers)',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const auth = context.auth as SimplybookAuth;
    await subscribeWebhook(auth, context.webhookUrl, 'change');
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
    is_confirmed: true,
    start_datetime: '2025-10-05 15:00:00',
    end_datetime: '2025-10-05 16:00:00',
    location_id: 1,
    category_id: 2,
    service_id: 3,
    provider_id: 5,
    client_id: 10,
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
      id: 5,
      name: 'Jane Doe',
      email: 'jane@example.com'
    },
    location: {
      id: 1,
      name: 'Main Office'
    },
    category: {
      id: 2,
      name: 'Medical Services'
    },
    changes: {
      previous: {
        start_datetime: '2025-10-05 14:00:00',
        provider_id: 4
      },
      current: {
        start_datetime: '2025-10-05 15:00:00',
        provider_id: 5
      }
    }
  }
});

import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest, SimplyBookAuth } from '../common';

export const newBookingTrigger = createTrigger({
  auth: simplyBookAuth,
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new booking is created',
  props: {
    providerId: Property.Number({
      displayName: 'Provider ID',
      description: 'Filter by specific provider (optional)',
      required: false,
    }),
    serviceId: Property.Number({
      displayName: 'Service ID',
      description: 'Filter by specific service (optional)',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345,
    client_id: 67890,
    service_id: 111,
    provider_id: 222,
    start_datetime: '2023-12-01T10:00:00Z',
    end_datetime: '2023-12-01T11:00:00Z',
    status: 'confirmed',
    notes: 'First appointment',
    created_at: '2023-11-28T14:30:00Z',
  },
  async onEnable(context: { store: any }) {
    // Store the current timestamp to track new bookings
    await context.store.put('last_check', new Date().toISOString());
  },
  async onDisable(context: { store: any }) {
    // Clean up if needed
    await context.store.delete('last_check');
  },
  async run(context: { propsValue: any; auth: SimplyBookAuth; store: any }) {
    const lastCheck = await context.store.get('last_check');
    const now = new Date().toISOString();
    
    const params: Record<string, any> = {
      start_date: lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Default to last 24 hours
      end_date: now,
      ...(context.propsValue.providerId && { provider_id: context.propsValue.providerId }),
      ...(context.propsValue.serviceId && { service_id: context.propsValue.serviceId }),
    };

    const bookings = await makeApiRequest(context.auth, 'getBookings', params);
    
    // Update the last check timestamp
    await context.store.put('last_check', now);
    
    return bookings || [];
  },
});

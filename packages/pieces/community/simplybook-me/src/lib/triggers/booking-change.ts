import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const bookingChangeTrigger = createTrigger({
  auth: simplyBookAuth,
  name: 'booking_change',
  displayName: 'Booking Change',
  description: 'Triggers when booking details change (date, time, service, provider, status, intake form answers)',
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
    notes: 'Updated appointment time',
    updated_at: '2023-11-28T16:30:00Z',
    changes: {
      start_datetime: '2023-12-01T09:00:00Z',
      end_datetime: '2023-12-01T10:00:00Z',
    },
  },
  async onEnable(context) {
    // Store the current timestamp to track booking changes
    await context.store.put('last_change_check', new Date().toISOString());
  },
  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('last_change_check');
  },
  async run(context) {
    const lastCheck = await context.store.get<string>('last_change_check');
    const now = new Date().toISOString();
    
    const params: Record<string, any> = {
      start_date: lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_date: now,
      include_changes: true,
      ...(context.propsValue.providerId && { provider_id: context.propsValue.providerId }),
      ...(context.propsValue.serviceId && { service_id: context.propsValue.serviceId }),
    };

    const bookings = await makeApiRequest(context.auth, 'getBookings', params);
    
    // Filter for bookings that have been updated
    const changedBookings = (bookings || []).filter((booking: any) => 
      booking.updated_at && booking.updated_at > lastCheck
    );
    
    // Update the last check timestamp
    await context.store.put('last_change_check', now);
    
    return changedBookings;
  },
});

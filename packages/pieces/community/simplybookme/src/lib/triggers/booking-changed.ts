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
    const queryParams: string[] = ['on_page=100', 'page=1'];

    // Add status filter if provided
    if (context.propsValue.status) {
      queryParams.push(`filter[status]=${context.propsValue.status}`);
    }

    const queryString = `?${queryParams.join('&')}`;

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/bookings${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      const bookings = response.body?.data || [];
      const changedBookings: any[] = [];
      const newSnapshots: Record<number, BookingSnapshot> = {};

      for (const booking of bookings) {
        const bookingId = booking.id;
        const currentSnapshot: BookingSnapshot = {
          id: booking.id,
          start_datetime: booking.start_datetime,
          end_datetime: booking.end_datetime,
          service_id: booking.service_id,
          provider_id: booking.provider_id,
          status: booking.is_confirmed ? 'confirmed' : 'pending',
          is_confirmed: booking.is_confirmed,
          location_id: booking.location_id,
          category_id: booking.category_id,
          client_id: booking.client_id
        };

        // Store current snapshot for next comparison
        newSnapshots[bookingId] = currentSnapshot;

        // Check if we have a previous snapshot
        const previousSnapshot = storedSnapshots[bookingId];

        if (previousSnapshot) {
          // Compare snapshots to detect changes
          const hasChanged =
            previousSnapshot.start_datetime !== currentSnapshot.start_datetime ||
            previousSnapshot.end_datetime !== currentSnapshot.end_datetime ||
            previousSnapshot.service_id !== currentSnapshot.service_id ||
            previousSnapshot.provider_id !== currentSnapshot.provider_id ||
            previousSnapshot.is_confirmed !== currentSnapshot.is_confirmed ||
            previousSnapshot.location_id !== currentSnapshot.location_id ||
            previousSnapshot.category_id !== currentSnapshot.category_id ||
            previousSnapshot.client_id !== currentSnapshot.client_id;

          if (hasChanged) {
            // Add change details to the booking
            changedBookings.push({
              ...booking,
              changes: {
                previous: previousSnapshot,
                current: currentSnapshot
              }
            });
          }
        }
      }

      // Update stored snapshots
      await context.store.put('bookingSnapshots', newSnapshots);

      return changedBookings;
    } catch (error: any) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  },
  async test(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams: string[] = ['on_page=5', 'page=1'];

    // Add status filter if provided
    if (context.propsValue.status) {
      queryParams.push(`filter[status]=${context.propsValue.status}`);
    }

    const queryString = `?${queryParams.join('&')}`;

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/bookings${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body?.data || [];
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
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
        id: 123456,
        start_datetime: '2025-10-05 14:00:00',
        end_datetime: '2025-10-05 15:00:00',
        service_id: 3,
        provider_id: 4,
        status: 'confirmed',
        is_confirmed: true,
        location_id: 1,
        category_id: 2,
        client_id: 10
      },
      current: {
        id: 123456,
        start_datetime: '2025-10-05 15:00:00',
        end_datetime: '2025-10-05 16:00:00',
        service_id: 3,
        provider_id: 5,
        status: 'confirmed',
        is_confirmed: true,
        location_id: 1,
        category_id: 2,
        client_id: 10
      }
    }
  }
});

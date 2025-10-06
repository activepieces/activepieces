import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

interface BookingStatusSnapshot {
  id: number;
  status: string;
}

export const bookingCanceled = createTrigger({
  auth: simplybookAuth,
  name: 'booking_canceled',
  displayName: 'Booking Canceled',
  description: 'Triggers when a booking is canceled',
  type: TriggerStrategy.POLLING,
  props: {
    includeAllStatuses: Property.Checkbox({
      displayName: 'Include All Statuses',
      description:
        'Monitor all bookings (not just confirmed ones) for cancellations',
      required: false,
      defaultValue: false
    })
  },
  async onEnable(context) {
    // Initialize with empty status snapshots
    await context.store.put('bookingStatuses', {});
  },
  async onDisable(context) {
    await context.store.delete('bookingStatuses');
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const storedStatuses =
      (await context.store.get<Record<number, BookingStatusSnapshot>>(
        'bookingStatuses'
      )) || {};

    // Build query parameters - fetch all bookings including canceled ones
    const queryParams: string[] = ['on_page=100', 'page=1'];

    // If not including all statuses, only monitor confirmed/pending bookings
    if (!context.propsValue.includeAllStatuses) {
      // We'll fetch all and filter later since we need to detect transitions to canceled
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
      const canceledBookings: any[] = [];
      const newStatuses: Record<number, BookingStatusSnapshot> = {};

      for (const booking of bookings) {
        const bookingId = booking.id;
        const currentStatus = booking.status || 'unknown';

        // Store current status for next comparison
        newStatuses[bookingId] = {
          id: bookingId,
          status: currentStatus
        };

        // Check if we have a previous status
        const previousStatus = storedStatuses[bookingId];

        if (previousStatus) {
          // Detect if booking was changed to canceled
          const wasCanceled =
            previousStatus.status !== 'canceled' && currentStatus === 'canceled';

          if (wasCanceled) {
            canceledBookings.push({
              ...booking,
              cancellation_info: {
                previous_status: previousStatus.status,
                canceled_at: new Date().toISOString()
              }
            });
          }
        }
      }

      // Update stored statuses
      await context.store.put('bookingStatuses', newStatuses);

      return canceledBookings;
    } catch (error: any) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  },
  async test(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    // Build query parameters - fetch canceled bookings for testing
    const queryParams: string[] = ['on_page=5', 'page=1', 'filter[status]=canceled'];

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

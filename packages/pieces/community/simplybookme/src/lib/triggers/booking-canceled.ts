import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper
} from '@activepieces/pieces-common';
import { simplybookAuth, makeJsonRpcCall } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof simplybookAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const authData = auth;

    // Get canceled bookings - using booking_type filter
    // This will return bookings with is_confirmed=0 and status='cancelled'
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    // Use created_date to track when cancellation happened, not booking date
    const bookings = await makeJsonRpcCall<any[]>(authData, 'getBookings', [
      { 
        created_date_from: dateFrom, 
        created_date_to: dateTo, 
        booking_type: 'cancelled',
        order: 'record_date'
      }
    ]);

    // Handle object with numeric keys format
    let bookingArray: any[] = [];
    if (Array.isArray(bookings)) {
      bookingArray = bookings;
    } else if (bookings && typeof bookings === 'object') {
      const keys = Object.keys(bookings);
      if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
        bookingArray = Object.values(bookings);
      }
    }

    // Sort by record_date (most recent first) to ensure proper ordering
    return bookingArray
      .sort((a, b) => {
        const dateA = new Date(a.record_date || 0).getTime();
        const dateB = new Date(b.record_date || 0).getTime();
        return dateB - dateA;
      })
      .map((booking) => ({
        // Use record_date + id as unique identifier for better deduplication
        id: `${booking.record_date}_${booking.id}`,
        data: booking
      }));
  }
};

export const bookingCanceled = createTrigger({
  auth: simplybookAuth,
  name: 'booking_canceled',
  displayName: 'Booking Cancellation',
  description: 'Triggers when a booking is canceled in SimplyBook.me',
  type: TriggerStrategy.POLLING,
  props: {},
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
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

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
import { simplybookAuth, SimplybookAuth, makeJsonRpcCall } from '../common';

const polling: Polling<PiecePropValueSchema<typeof simplybookAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, store }) => {
    const authData = auth;
    
    // Get all bookings from the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];
    
    const bookings = await makeJsonRpcCall<any[]>(
      authData,
      'getBookings',
      [{ date_from: dateFrom, date_to: dateTo, booking_type: 'non_cancelled' }]
    );
    
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
    
    // Store previous state to detect changes
    const previousBookings = (await store.get<Record<number, string>>('bookings_state')) || {};
    const currentBookings: Record<number, string> = {};
    const changedBookings: any[] = [];
    
    for (const booking of bookingArray) {
      const bookingHash = JSON.stringify(booking);
      currentBookings[booking.id] = bookingHash;
      
      // If booking exists and hash changed, it was modified
      if (previousBookings[booking.id] && previousBookings[booking.id] !== bookingHash) {
        changedBookings.push(booking);
      }
    }
    
    await store.put('bookings_state', currentBookings);
    
    return changedBookings
      .sort((a, b) => b.id - a.id)
      .map((booking) => ({
        id: booking.id,
        data: booking
      }));
  }
};

export const bookingChanged = createTrigger({
  auth: simplybookAuth,
  name: 'booking_changed',
  displayName: 'Booking Change',
  description:
    'Triggers when booking details change (date, time, service, provider, status, intake form answers)',
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

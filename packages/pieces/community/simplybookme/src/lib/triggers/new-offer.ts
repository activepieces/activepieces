import {
  createTrigger,
  AppConnectionValueForAuthProperty,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper
} from '@activepieces/pieces-common';
import { simplybookAuth, makeJsonRpcCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof simplybookAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const authData = auth;

    // Calculate date range based on last fetch time
    const now = new Date();
    const lastFetch = lastFetchEpochMS ? new Date(lastFetchEpochMS) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    
    const dateFrom = lastFetch.toISOString().split('T')[0];
    const dateTo = now.toISOString().split('T')[0];

    // Get bookings with promo: false (offers/proposals)
    const bookings = await makeJsonRpcCall<any[]>(authData.props, 'getBookings', [
      {
        created_date_from: dateFrom,
        created_date_to: dateTo,
        booking_type: 'non_cancelled',
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

    // Filter bookings where promo === false (offers/proposals)
    const filteredOffers = bookingArray.filter((booking) => {
      if (!booking.record_date) return false;
      const recordTime = new Date(booking.record_date).getTime();
      // Check if promo is explicitly false (indicating an offer/proposal)
      const isOffer = booking.promo === false;
      return recordTime > lastFetchEpochMS && isOffer;
    });

    // Sort by record_date (most recent first)
    return filteredOffers
      .sort((a, b) => {
        const dateA = new Date(a.record_date || 0).getTime();
        const dateB = new Date(b.record_date || 0).getTime();
        return dateB - dateA;
      })
      .map((offer) => ({
        epochMilliSeconds: new Date(offer.record_date).getTime(),
        data: offer
      }));
  }
};

export const newOffer = createTrigger({
  auth: simplybookAuth,
  name: 'new_offer',
  displayName: 'New Offer',
  description: 'Triggers when a new offer (proposal or quote) is created (bookings with promo: false)',
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
    id: 2,
    record_date: '2025-10-08 09:22:32',
    start_date: '2025-10-08 15:00:00',
    end_date: '2025-10-08 16:00:00',
    client_timezone: null,
    unit_id: '3',
    text: 'client fort',
    client: 'client fort',
    unit: 'providertest',
    unit_email: 'provider@example.com',
    event: 'Consultation',
    event_id: '2',
    is_confirm: '1',
    client_id: '1',
    client_phone: '+1234567890',
    client_email: 'client@example.com',
    offset: '0',
    comment: 'Offer for consultation service',
    code: '23lt1xy7',
    event_duration: '60',
    promo: false,
    promo_code: 'OFFER2025',
    discount: 10.00
  }
});

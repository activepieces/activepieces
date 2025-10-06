import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const newBooking = createTrigger({
  auth: simplybookAuth,
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new booking is created',
  type: TriggerStrategy.POLLING,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by booking status',
      required: false,
      options: {
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Confirmed Pending', value: 'confirmed_pending' },
          { label: 'Pending', value: 'pending' },
          { label: 'Canceled', value: 'canceled' }
        ]
      }
    })
  },
  async onEnable(context) {
    // Store the highest booking ID to track new bookings from this point forward
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: 'https://user-api-v2.simplybook.me/admin/bookings?on_page=1&page=1',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      const bookings = response.body?.data || [];
      if (bookings.length > 0) {
        const maxId = Math.max(...bookings.map((b: any) => b.id));
        await context.store.put('lastBookingId', maxId);
      } else {
        await context.store.put('lastBookingId', 0);
      }
    } catch {
      await context.store.put('lastBookingId', 0);
    }
  },
  async onDisable(context) {
    await context.store.delete('lastBookingId');
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const lastBookingId =
      (await context.store.get<number>('lastBookingId')) || 0;

    // Build query parameters
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

      // Filter for new bookings with ID greater than last seen
      const newBookings = bookings.filter((booking: any) => {
        return booking.id > lastBookingId;
      });

      // Update last booking ID if we have bookings
      if (bookings.length > 0) {
        const maxId = Math.max(...bookings.map((b: any) => b.id));
        await context.store.put('lastBookingId', maxId);
      }

      return newBookings;
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

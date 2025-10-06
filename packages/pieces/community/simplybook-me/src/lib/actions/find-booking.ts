import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import {
  SimplyBookClient,
  BookingQuery,
  BookingQuerySchema,
  createDropdownOptions,
} from '../common';

export const findBooking = createAction({
  auth: simplybookAuth,
  name: 'find_booking',
  displayName: 'Find Booking',
  description: 'Search for bookings in SimplyBook.me',
  props: {
    clientId: Property.Dropdown({
      displayName: 'Client',
      description: 'Filter by client (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.clients(auth),
    }),
    serviceId: Property.Dropdown({
      displayName: 'Service',
      description: 'Filter by service (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.services(auth),
    }),
    providerId: Property.Dropdown({
      displayName: 'Provider',
      description: 'Filter by provider (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.providers(auth),
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Filter bookings from this date',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Filter bookings until this date',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Filter by booking status',
      required: false,
    }),
  },
  async run(context) {
    const { clientId, serviceId, providerId, startDate, endDate, status } =
      context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const query: BookingQuery = {
      client_id: clientId,
      service_id: serviceId,
      provider_id: providerId,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    const validatedQuery = BookingQuerySchema.parse(query);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const bookings = await client.findBooking(validatedQuery);
      return {
        success: true,
        bookings,
        count: bookings.length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});

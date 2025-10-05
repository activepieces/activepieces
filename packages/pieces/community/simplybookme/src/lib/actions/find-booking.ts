import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const findBooking = createAction({
  auth: simplybookAuth,
  name: 'find_booking',
  displayName: 'Find Booking',
  description: 'Find bookings with filters and pagination',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number in the list',
      required: false,
      defaultValue: 1
    }),
    onPage: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page',
      required: false,
      defaultValue: 25
    }),
    upcomingOnly: Property.Checkbox({
      displayName: 'Upcoming Only',
      description: 'Return upcoming bookings only',
      required: false,
      defaultValue: false
    }),
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
    }),
    services: Property.Json({
      displayName: 'Service IDs',
      description: 'Array of service IDs to filter by (e.g., [1, 2, 3])',
      required: false
    }),
    providers: Property.Json({
      displayName: 'Provider IDs',
      description: 'Array of provider IDs to filter by (e.g., [1, 2, 3])',
      required: false
    }),
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'Filter by client ID',
      required: false
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Filter by date (format: YYYY-MM-DD)',
      required: false
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string (by code, client data)',
      required: false
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Search by additional fields (e.g., {"field_id": "value"})',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams: string[] = [];

    // Pagination
    if (context.propsValue.page) {
      queryParams.push(`page=${context.propsValue.page}`);
    }
    if (context.propsValue.onPage) {
      queryParams.push(`on_page=${context.propsValue.onPage}`);
    }

    // Filters
    if (context.propsValue.upcomingOnly) {
      queryParams.push('filter[upcoming_only]=1');
    }
    if (context.propsValue.status) {
      queryParams.push(`filter[status]=${context.propsValue.status}`);
    }
    if (context.propsValue.services) {
      const services = Array.isArray(context.propsValue.services)
        ? context.propsValue.services
        : [context.propsValue.services];
      services.forEach((serviceId: any) => {
        queryParams.push(`filter[services][]=${serviceId}`);
      });
    }
    if (context.propsValue.providers) {
      const providers = Array.isArray(context.propsValue.providers)
        ? context.propsValue.providers
        : [context.propsValue.providers];
      providers.forEach((providerId: any) => {
        queryParams.push(`filter[providers][]=${providerId}`);
      });
    }
    if (context.propsValue.clientId) {
      queryParams.push(`filter[client_id]=${context.propsValue.clientId}`);
    }
    if (context.propsValue.date) {
      queryParams.push(`filter[date]=${context.propsValue.date}`);
    }
    if (context.propsValue.search) {
      queryParams.push(`filter[search]=${encodeURIComponent(context.propsValue.search)}`);
    }
    if (context.propsValue.additionalFields) {
      const fields = context.propsValue.additionalFields as Record<string, any>;
      Object.entries(fields).forEach(([field, value]) => {
        queryParams.push(`filter[additional_fields][${field}]=${encodeURIComponent(value)}`);
      });
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/bookings${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to find bookings: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to find bookings: ${error.message}`);
    }
  }
});

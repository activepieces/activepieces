import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const getBookings = createAction({
  auth: calcomAuth,
  name: 'get_bookings',
  displayName: 'Get Bookings',
  description: 'Retrieve all bookings for the authenticated user',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter bookings by status',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Past', value: 'past' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Recurring', value: 'recurring' },
        ],
      },
    }),
    take: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of bookings to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const { status, take } = propsValue;

    const queryParams: Record<string, string> = {};

    if (status) {
      queryParams['status'] = status;
    }

    if (take) {
      queryParams['take'] = take.toString();
    }

    const response = await calComApiCall<{
      status: string;
      data: unknown[];
    }>(auth.secret_text, HttpMethod.GET, '/bookings', undefined, queryParams);

    return response;
  },
});

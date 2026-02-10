import { createAction, Property } from '@activepieces/pieces-framework';
import { waitwhileAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomers = createAction({
  auth: waitwhileAuth,
  name: 'searchCustomers',
  displayName: 'Search customers',
  description: 'Search for customers by name, phone, email, or identifier',
  props: {
    q: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Search query for name, phone, email, or customer identifier (prefix match)',
      required: false,
    }),
    locationId: Property.ShortText({
      displayName: 'Location ID',
      description: 'Filter by location identifier',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'Visit State',
      description: 'Filter by visit state',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'PENDING' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Waiting', value: 'WAITING' },
          { label: 'Cancelled', value: 'BOOKED' },
          { label: 'Serving', value: 'SERVING' },
          { label: 'Completed', value: 'COMPLETE' },
        ],
      },
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Filter by tag associated with visit',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max number of results (1-100, defaults to 20)',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page in results (defaults to 1)',
      required: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'From Date',
      description: 'Start date in ISO-8601 format (e.g., 2024-01-01T00:00:00Z)',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To Date',
      description: 'End date in ISO-8601 format (e.g., 2024-12-31T23:59:59Z)',
      required: false,
    }),
  },
  async run(context) {
    const { q, locationId, state, tag, limit, page, fromDate, toDate } =
      context.propsValue;
    const api_key = context.auth.secret_text;

    const params = new URLSearchParams();
    if (q) {
      params.append('q', q);
    }
    if (locationId) {
      params.append('locationId', locationId);
    }
    if (state) {
      params.append('state', state);
    }
    if (tag) {
      params.append('tag', tag);
    }
    if (limit !== undefined && limit !== null) {
      params.append('limit', limit.toString());
    }
    if (page !== undefined && page !== null) {
      params.append('page', page.toString());
    }
    if (fromDate) {
      params.append('fromDate', fromDate);
    }
    if (toDate) {
      params.append('toDate', toDate);
    }

    const queryString = params.toString();
    const path = queryString
      ? `/customers/search?${queryString}`
      : '/customers/search';

    const response = await makeRequest(api_key, HttpMethod.GET, path);
    return response;
  },
});

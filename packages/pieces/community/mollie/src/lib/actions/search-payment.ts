import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchPayment = createAction({
  auth: MollieAuth,
  name: 'searchPayment',
  displayName: 'Search Payment',
  description: 'Search for payments based on filter criteria',
  props: {
    from: Property.ShortText({
      displayName: 'From Payment ID',
      description: 'Payment ID to start searching from (for pagination)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of payments to return (max 250, default 10)',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Filter payments by profile ID',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Order of results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: string[] = [];

    if (propsValue.from) {
      queryParams.push(`from=${encodeURIComponent(propsValue.from)}`);
    }
    if (propsValue.limit) {
      queryParams.push(`limit=${propsValue.limit}`);
    }
    if (propsValue.profileId) {
      queryParams.push(`profileId=${encodeURIComponent(propsValue.profileId)}`);
    }
    if (propsValue.sort) {
      queryParams.push(`sort=${propsValue.sort}`);
    }

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = `/payments${queryString}`;

    const response = await makeRequest(auth, HttpMethod.GET, endpoint);
    const payments = response._embedded?.payments || [];
    const paymentCount = payments.length;
    return {
      payments: payments,
      count: paymentCount,
    };
  },
});

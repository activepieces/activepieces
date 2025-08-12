import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchCustomer = createAction({
  auth: MollieAuth,
  name: 'searchCustomer',
  displayName: 'Search Customer',
  description: 'Find customers based on filter criteria',
  props: {
    from: Property.ShortText({
      displayName: 'From Customer ID',
      description: 'Customer ID to start searching from (for pagination)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of customers to return (max 250, default 10)',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Filter customers by profile ID',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: string[] = [];

    // Add query parameters if provided
    if (propsValue.from) {
      queryParams.push(`from=${encodeURIComponent(propsValue.from)}`);
    }
    if (propsValue.limit) {
      queryParams.push(`limit=${propsValue.limit}`);
    }
    if (propsValue.profileId) {
      queryParams.push(`profileId=${encodeURIComponent(propsValue.profileId)}`);
    }
    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const endpoint = `/customers${queryString}`;

    const response = await makeRequest(auth.access_token, HttpMethod.GET, endpoint);

    return response._embedded.customers;
  },
});

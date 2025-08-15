import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MollieAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchOrder = createAction({
  auth: MollieAuth,
  name: 'searchOrder',
  displayName: 'Search Orders',
  description:
    "Search for orders in Mollie. Note: Consider using the Payments API search for most use cases as it's more widely applicable.",
  props: {
    from: Property.ShortText({
      displayName: 'From Order ID',
      description:
        'Offset the result set to the order with this ID (exclusive)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of orders to return (default: 50, max: 250)',
      required: false,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Filter orders by specific profile ID',
      required: false,
    }),

    embed: Property.StaticMultiSelectDropdown({
      displayName: 'Embed Related Data',
      description: 'Include related data in the response',
      required: false,
      options: {
        options: [
          { label: 'Payments', value: 'payments' },
          { label: 'Refunds', value: 'refunds' },
          { label: 'Shipments', value: 'shipments' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: any = {};

    if (propsValue.from) {
      queryParams.from = propsValue.from;
    }

    if (propsValue.limit) {
      const limit = Number(propsValue.limit);
      if (limit < 1 || limit > 250) {
        throw new Error('Limit must be between 1 and 250');
      }
      queryParams.limit = limit.toString();
    }

    if (propsValue.profileId) {
      queryParams.profileId = propsValue.profileId;
    }

    if (propsValue.embed && propsValue.embed.length > 0) {
      queryParams.embed = propsValue.embed.join(',');
    }

    const queryString =
      Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams).toString()
        : '';

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/orders${queryString}`
    );

    return response._embedded.orders || [];
  },
});

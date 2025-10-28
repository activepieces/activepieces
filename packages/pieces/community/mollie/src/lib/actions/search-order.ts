import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mollieCommon } from '../common';
import { mollieAuth } from '../../index';

export const mollieSearchOrder = createAction({
  auth: mollieAuth,
  name: 'search_order',
  displayName: 'Search Order',
  description:
    '⚠️ We no longer recommend using the Orders API. Please refer to the Payments API instead.\n\nSearches for orders in Mollie',
  props: {
    from: Property.ShortText({
      displayName: 'From Order ID',
      description: 'Start the result set from this order ID onwards',
      required: false,
    }),

    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of orders to return (1-250, default: 50)',
      required: false,
    }),

    sort: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Sort orders by creation date',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest first (Descending)', value: 'desc' },
          { label: 'Oldest first (Ascending)', value: 'asc' },
        ],
      },
    }),

    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Profile ID to retrieve orders for (optional)',
      required: false,
    }),

    testmode: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'Whether to search in test mode',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const apiKey = auth as string;

    const queryParams: Record<string, string> = {};

    if (propsValue.from) {
      queryParams['from'] = propsValue.from;
    }
    if (propsValue.limit) {
      queryParams['limit'] = propsValue.limit.toString();
    }
    if (propsValue.sort) {
      queryParams['sort'] = propsValue.sort;
    }
    if (propsValue.profileId) {
      queryParams['profileId'] = propsValue.profileId;
    }
    if (propsValue.testmode !== undefined) {
      queryParams['testmode'] = propsValue.testmode.toString();
    }

    const queryString = Object.keys(queryParams)
      .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const url = queryString ? `/orders?${queryString}` : '/orders';

    const response = await mollieCommon.makeRequest(
      apiKey,
      HttpMethod.GET,
      url
    );

    return response;
  },
});

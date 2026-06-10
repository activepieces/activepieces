import { createAction, Property } from '@activepieces/pieces-framework';
import { paywhirlAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCustomersSubscription = createAction({
  auth: paywhirlAuth,
  name: 'searchCustomersSubscription',
  displayName: 'Get Customer Subscriptions',
  description:
    'Get a list of subscriptions associated with a given customer. Useful for determining which services a customer is currently expecting.',
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Customer ID',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Filter by subscription status. Active (default) excludes canceled; Canceled shows only canceled; All shows all subscriptions.',
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'All', value: 'all' },
        ],
      },
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, status } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const path = `/subscriptions/${customer_id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await makeRequest(
      context.auth.props.api_key,
      context.auth.props.api_secret,
      HttpMethod.GET,
      path
    );

    return response;
  },
});

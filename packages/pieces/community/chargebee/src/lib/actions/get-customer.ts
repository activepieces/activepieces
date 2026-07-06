import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest } from '../common/client';

export const getCustomer = createAction({
  name: 'get_customer',
  auth: chargebeeAuth,
  displayName: 'Get Customer',
  description: 'Retrieve a customer from Chargebee by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch a single Chargebee customer record by its customer ID. Use when an agent needs to read a known customer\'s details before acting on them. Requires the exact customer ID; does not search by email or other fields. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
  },
  async run(context) {
    const { customer_id } = context.propsValue;

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.GET,
      path: `/customers/${encodeURIComponent(customer_id)}`,
    });
  },
});

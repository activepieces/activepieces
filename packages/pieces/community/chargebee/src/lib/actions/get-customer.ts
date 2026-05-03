import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest } from '../common/client';

export const getCustomer = createAction({
  name: 'get_customer',
  auth: chargebeeAuth,
  displayName: 'Get Customer',
  description: 'Retrieve a customer from Chargebee by ID.',
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

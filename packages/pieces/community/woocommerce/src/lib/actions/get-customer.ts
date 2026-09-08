import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { getCustomerOutputSchema } from '../output-schemas';

export const wooGetCustomer = createAction({
  name: 'Get Customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Retrieve a single customer by their ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one customer from a WooCommerce store by their numeric customer ID, including billing and shipping addresses. Use when an agent has a customer ID rather than an email address; Find Customer searches by email instead. Read-only and idempotent.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: getCustomerOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Enter the customer ID',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const customerId = configValue.propsValue['id'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers/${customerId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});

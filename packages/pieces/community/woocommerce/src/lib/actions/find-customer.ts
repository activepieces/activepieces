import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { findCustomerOutputSchema } from '../output-schemas';

export const wooFindCustomer = createAction({
  name: 'Find Customer',
  classification: 'READ',
  displayName: 'Find Customer',
  description: 'Find a customer by their email address',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up customers in a WooCommerce store by exact email address. Use when an agent needs to resolve a shopper to their customer record or ID before referencing them. Read-only and idempotent. Requires the email; returns matching customers (empty if none match).',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: findCustomerOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The exact email address the customer signed up with.',
      placeholder: 'jane@example.com',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const email = configValue.propsValue['email'].trim();

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers`,
      queryParams: { email },
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

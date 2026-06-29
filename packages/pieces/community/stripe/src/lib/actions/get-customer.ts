import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const stripeGetCustomer = createAction({
  name: 'get_customer',
  auth: stripeAuth,
  displayName: 'Get Customer (Agent)',
  description: 'Retrieve a Stripe customer by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the full details of a single Stripe customer by its customer ID (e.g., cus_...). Use when you already have the exact ID; to look a customer up by email use Search Customers, or List Customers to page through them. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...). Obtain it from Search Customers or List Customers.',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/customers/${id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

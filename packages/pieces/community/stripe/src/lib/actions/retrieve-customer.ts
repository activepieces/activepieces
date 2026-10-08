import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { customerOutputSchema } from '../output-schemas';
export const stripeRetrieveCustomer = createAction({
  name: 'retrieve_customer',
  classification: 'READ',
  auth: stripeAuth,
  displayName: 'Retrieve Customer',
  description: "Get a customer's details by their ID.",
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches the full details of a single Stripe customer by its customer ID (e.g., cus_...). Use when you already have the exact ID and need the current record; for lookup by email use Search Customer instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Customer ID',
      description: "Starts with cus_. Find it on the customer's page in Stripe.",
      placeholder: 'cus_...',
      required: true,
    }),
  },
  outputSchema: customerOutputSchema,
  async run(context) {
    const { id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/customers/${encodeURIComponent(id)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

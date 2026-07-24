import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

import { customerOutputSchema } from '../output-schemas';
export const stripeRetrieveCustomer = createAction({
  name: 'retrieve_customer',
  auth: stripeAuth,
  displayName: 'Retrieve Customer',
  description: 'Retrieve a customer in stripe by id',
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches the full details of a single Stripe customer by its customer ID (e.g., cus_...). Use when you already have the exact ID and need the current record; for lookup by email use Search Customer instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'ID',
      description: undefined,
      required: true,
    }),
  },
  outputSchema: customerOutputSchema,
  async run(context) {
    const customer = {
      id: context.propsValue.id,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.stripe.com/v1/customers/${customer.id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

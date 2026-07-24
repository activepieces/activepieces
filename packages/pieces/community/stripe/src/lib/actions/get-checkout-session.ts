import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { checkoutSessionOutputSchema } from '../output-schemas';
export const stripeGetCheckoutSession = createAction({
  name: 'get_checkout_session',
  auth: stripeAuth,
  displayName: 'Get Checkout Session (Agent)',
  description: 'Retrieve a Stripe Checkout Session by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Checkout Session by its ID (e.g., cs_...), including payment status, customer, and amounts. Use List Checkout Sessions to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description:
        'The Checkout Session ID (e.g., cs_...). Obtain it from List Checkout Sessions.',
      required: true,
    }),
  },
  outputSchema: checkoutSessionOutputSchema,
  async run(context) {
    const { session_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/checkout/sessions/${session_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

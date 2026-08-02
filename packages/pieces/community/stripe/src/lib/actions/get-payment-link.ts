import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { paymentLinkOutputSchema } from '../output-schemas';
export const stripeGetPaymentLink = createAction({
  name: 'get_payment_link',
  auth: stripeAuth,
  displayName: 'Get Payment Link (Agent)',
  description: 'Retrieve a Stripe payment link by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe payment link by its ID (e.g., plink_...), including its URL, active state, and line items. Use List Payment Links to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payment_link_id: Property.ShortText({
      displayName: 'Payment Link ID',
      description:
        'The payment link ID (e.g., plink_...). Obtain it from List Payment Links.',
      required: true,
    }),
  },
  outputSchema: paymentLinkOutputSchema,
  async run(context) {
    const { payment_link_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payment_links/${payment_link_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

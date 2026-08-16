import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { refundOutputSchema } from '../output-schemas';
export const stripeGetRefund = createAction({
  name: 'get_refund',
  auth: stripeAuth,
  displayName: 'Get Refund (Agent)',
  description: 'Retrieve a Stripe refund by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe refund by its refund ID (e.g., re_...) to check its status and amount. Use List Refunds to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    refund_id: Property.ShortText({
      displayName: 'Refund ID',
      description:
        'The Stripe refund ID (e.g., re_...). Obtain it from List Refunds.',
      required: true,
    }),
  },
  outputSchema: refundOutputSchema,
  async run(context) {
    const { refund_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/refunds/${refund_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

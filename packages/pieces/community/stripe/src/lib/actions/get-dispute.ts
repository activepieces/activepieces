import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { disputeOutputSchema } from '../output-schemas';
export const stripeGetDispute = createAction({
  name: 'get_dispute',
  auth: stripeAuth,
  displayName: 'Get Dispute (Agent)',
  description: 'Retrieve a dispute by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe dispute (chargeback) by its ID (e.g., dp_...), including its status, reason, and evidence due date. Use List Disputes to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    dispute_id: Property.ShortText({
      displayName: 'Dispute ID',
      description:
        'The dispute ID (e.g., dp_...). Obtain it from List Disputes.',
      required: true,
    }),
  },
  outputSchema: disputeOutputSchema,
  async run(context) {
    const { dispute_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/disputes/${dispute_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

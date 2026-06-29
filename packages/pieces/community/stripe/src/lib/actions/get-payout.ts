import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeGetPayout = createAction({
  name: 'get_payout',
  auth: stripeAuth,
  displayName: 'Get Payout (Agent)',
  description: 'Retrieve a Stripe payout by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe payout (funds sent to your bank account) by its payout ID (e.g., po_...). Use to check a payout\'s status, amount, or arrival date; use List Payouts to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payout_id: Property.ShortText({
      displayName: 'Payout ID',
      description:
        'The Stripe payout ID (e.g., po_...). Obtain it from List Payouts.',
      required: true,
    }),
  },
  async run(context) {
    const { payout_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/payouts/${payout_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

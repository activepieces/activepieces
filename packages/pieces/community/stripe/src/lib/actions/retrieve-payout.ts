import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeRetrievePayout = createAction({
  name: 'retrieve_payout',
  auth: stripeAuth,
  displayName: 'Retrieve a Payout',
  description: 'Retrieves the details of an existing payout by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full details of a single Stripe payout (funds sent to your bank account) by its payout ID (e.g., po_...). Use to check a payout\'s status, amount, or arrival date. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payout_id: stripeCommon.payout, 
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

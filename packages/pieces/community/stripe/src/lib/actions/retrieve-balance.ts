import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { balanceOutputSchema } from '../output-schemas';
export const stripeRetrieveBalance = createAction({
  name: 'retrieve_balance',
  auth: stripeAuth,
  displayName: 'Retrieve Balance (Agent)',
  description: 'Get the current Stripe account balance.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches the current Stripe account balance, broken down into available and pending funds by currency. Use to check how much can be paid out. Read-only and idempotent; takes no parameters.',
    idempotent: true,
  },
  props: {},
  outputSchema: balanceOutputSchema,
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/balance`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { disputeOutputSchema } from '../output-schemas';
export const stripeCloseDispute = createAction({
  name: 'close_dispute',
  auth: stripeAuth,
  displayName: 'Close Dispute (Agent)',
  description: 'Concede a dispute (DESTRUCTIVE — forfeits the funds).',
  audience: 'ai',
  aiMetadata: {
    description:
      'DESTRUCTIVE AND IRREVERSIBLE: closing a dispute concedes the chargeback and permanently forfeits the disputed funds — the money is lost and cannot be recovered. Almost always prefer Update Dispute (submit evidence to contest) instead. Only use when you explicitly intend to give up the dispute. Not idempotent.',
    idempotent: false,
  },
  props: {
    dispute_id: Property.ShortText({
      displayName: 'Dispute ID',
      description:
        'The dispute ID (e.g., dp_...) to concede. Obtain it from List Disputes.',
      required: true,
    }),
  },
  outputSchema: disputeOutputSchema,
  async run(context) {
    const { dispute_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/disputes/${dispute_id}/close`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {},
    });

    return response.body;
  },
});

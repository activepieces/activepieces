import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { transferListOutputSchema } from '../output-schemas';
export const stripeListTransfers = createAction({
  name: 'list_transfers',
  auth: stripeAuth,
  displayName: 'List Transfers (Agent)',
  description: 'List transfers to connected accounts (Stripe Connect).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through transfers to connected accounts, newest first, optionally filtered by destination. Stripe Connect platforms only — on a standard (non-Connect) account this returns an empty list, which is expected, not an error. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    destination: Property.ShortText({
      displayName: 'Destination Account ID',
      description: 'Filter to transfers to this connected account (acct_...).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: transferListOutputSchema,
  async run(context) {
    const { destination, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (destination) queryParams['destination'] = destination;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/transfers`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { chargeListOutputSchema } from '../output-schemas';
export const stripeListCharges = createAction({
  name: 'list_charges',
  auth: stripeAuth,
  displayName: 'List Charges (Agent)',
  description: 'List Stripe charges.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through charges, newest first, optionally filtered by customer, PaymentIntent, or a created timestamp range. Use to enumerate charges or resolve a charge ID; for query-language matching use Search Charges. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to charges for this customer (cus_...).',
      required: false,
    }),
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description: 'Filter to charges for this PaymentIntent (pi_...).',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: chargeListOutputSchema,
  async run(context) {
    const { customer, payment_intent, created_after, created_before, limit } =
      context.propsValue;

    const queryParams: QueryParams = {};
    if (customer) queryParams['customer'] = customer;
    if (payment_intent) queryParams['payment_intent'] = payment_intent;
    if (limit) queryParams['limit'] = limit.toString();
    if (created_after) {
      queryParams['created[gte]'] = Math.floor(
        new Date(created_after).getTime() / 1000
      ).toString();
    }
    if (created_before) {
      queryParams['created[lte]'] = Math.floor(
        new Date(created_before).getTime() / 1000
      ).toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/charges`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

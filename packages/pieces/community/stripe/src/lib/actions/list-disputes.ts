import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListDisputes = createAction({
  name: 'list_disputes',
  auth: stripeAuth,
  displayName: 'List Disputes (Agent)',
  description: 'List Stripe disputes (chargebacks).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through disputes (chargebacks), newest first, optionally filtered by charge, PaymentIntent, or created range. Use to enumerate disputes or resolve a dispute ID; use Get Dispute when you have the dp_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    charge: Property.ShortText({
      displayName: 'Charge ID',
      description: 'Filter to disputes for this charge (ch_...).',
      required: false,
    }),
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description: 'Filter to disputes for this PaymentIntent (pi_...).',
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
  async run(context) {
    const { charge, payment_intent, created_after, created_before, limit } =
      context.propsValue;

    const queryParams: QueryParams = {};
    if (charge) queryParams['charge'] = charge;
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
      url: `${stripeCommon.baseUrl}/disputes`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

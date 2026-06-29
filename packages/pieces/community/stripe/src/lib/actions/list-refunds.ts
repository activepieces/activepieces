import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListRefunds = createAction({
  name: 'list_refunds',
  auth: stripeAuth,
  displayName: 'List Refunds (Agent)',
  description: 'List Stripe refunds.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through refunds, newest first, optionally filtered by PaymentIntent or charge. Use to enumerate refunds for a payment or resolve a refund ID; use Get Refund when you have the re_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description: 'Filter to refunds for this PaymentIntent (pi_...).',
      required: false,
    }),
    charge: Property.ShortText({
      displayName: 'Charge ID',
      description: 'Filter to refunds for this charge (ch_...).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { payment_intent, charge, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (payment_intent) queryParams['payment_intent'] = payment_intent;
    if (charge) queryParams['charge'] = charge;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/refunds`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListCheckoutSessions = createAction({
  name: 'list_checkout_sessions',
  auth: stripeAuth,
  displayName: 'List Checkout Sessions (Agent)',
  description: 'List Stripe Checkout Sessions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through Checkout Sessions, newest first, optionally filtered by customer, PaymentIntent, or status. Use to enumerate sessions or resolve a session ID; use Get Checkout Session when you have the cs_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to sessions for this customer (cus_...).',
      required: false,
    }),
    payment_intent: Property.ShortText({
      displayName: 'Payment Intent ID',
      description: 'Filter to the session for this PaymentIntent (pi_...).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Complete', value: 'complete' },
          { label: 'Expired', value: 'expired' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { customer, payment_intent, status, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (customer) queryParams['customer'] = customer;
    if (payment_intent) queryParams['payment_intent'] = payment_intent;
    if (status) queryParams['status'] = status;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/checkout/sessions`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

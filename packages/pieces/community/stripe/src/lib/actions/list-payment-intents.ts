import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListPaymentIntents = createAction({
  name: 'list_payment_intents',
  auth: stripeAuth,
  displayName: 'List Payment Intents (Agent)',
  description: 'List Stripe PaymentIntents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through PaymentIntents, newest first, optionally filtered by customer or a created timestamp range. Use to enumerate payments or resolve a PaymentIntent ID; for query-language matching use Search Payment Intents, or Get Payment Intent when you have the pi_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to PaymentIntents for this customer (cus_...).',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only return PaymentIntents created at or after this time.',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Only return PaymentIntents created at or before this time.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
    starting_after: Property.ShortText({
      displayName: 'Starting After',
      description: 'A PaymentIntent ID cursor for pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { customer, created_after, created_before, limit, starting_after } =
      context.propsValue;

    const queryParams: QueryParams = {};
    if (customer) queryParams['customer'] = customer;
    if (limit) queryParams['limit'] = limit.toString();
    if (starting_after) queryParams['starting_after'] = starting_after;
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
      url: `${stripeCommon.baseUrl}/payment_intents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

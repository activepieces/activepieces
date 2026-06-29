import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListCustomerPaymentMethods = createAction({
  name: 'list_customer_payment_methods',
  auth: stripeAuth,
  displayName: 'List Customer Payment Methods (Agent)',
  description: "List a customer's attached payment methods.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Pages through the PaymentMethods attached to a customer, returning the pm_ IDs you can charge off-session. Use to find a customer's saved card before creating a payment. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The customer ID (e.g., cus_...). Obtain it from Search/List Customers.',
      required: true,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Filter by PaymentMethod type (e.g., card).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, type, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (type) queryParams['type'] = type;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/customers/${customer_id}/payment_methods`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

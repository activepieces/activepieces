import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListInvoices = createAction({
  name: 'list_invoices',
  auth: stripeAuth,
  displayName: 'List Invoices (Agent)',
  description: 'List Stripe invoices.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pages through invoices, newest first, optionally filtered by customer, status, or subscription. Use to enumerate invoices or resolve an invoice ID; for query-language matching use Search Invoices, or Get Invoice when you have the in_ ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter to invoices for this customer (cus_...).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by invoice status.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Open', value: 'open' },
          { label: 'Paid', value: 'paid' },
          { label: 'Uncollectible', value: 'uncollectible' },
          { label: 'Void', value: 'void' },
        ],
      },
    }),
    subscription: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'Filter to invoices for this subscription (sub_...).',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { customer, status, subscription, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (customer) queryParams['customer'] = customer;
    if (status) queryParams['status'] = status;
    if (subscription) queryParams['subscription'] = subscription;
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/invoices`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeListInvoiceLines = createAction({
  name: 'list_invoice_lines',
  auth: stripeAuth,
  displayName: 'List Invoice Lines (Agent)',
  description: 'List the line items on an invoice.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Pages through the line items of a single Stripe invoice. Use when you need only the lines; the lines are also returned inline by Get Invoice. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The invoice ID (e.g., in_...). Obtain it from List/Search Invoices.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  async run(context) {
    const { invoice_id, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (limit) queryParams['limit'] = limit.toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}/lines`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { invoiceOutputSchema } from '../output-schemas';
export const stripeGetInvoice = createAction({
  name: 'get_invoice',
  auth: stripeAuth,
  displayName: 'Get Invoice (Agent)',
  description: 'Retrieve a Stripe invoice by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe invoice by its invoice ID (e.g., in_...). Use when you have the exact ID and need its current status, amounts, lines, or hosted/PDF links; use List/Search Invoices to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The Stripe invoice ID (e.g., in_...). Obtain it from List Invoices or Search Invoices.',
      required: true,
    }),
  },
  outputSchema: invoiceOutputSchema,
  async run(context) {
    const { invoice_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});

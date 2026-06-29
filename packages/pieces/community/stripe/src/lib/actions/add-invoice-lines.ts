import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeAddInvoiceLines = createAction({
  name: 'add_invoice_lines',
  auth: stripeAuth,
  displayName: 'Add Invoice Lines (Agent)',
  description: 'Bulk-add line items to a draft invoice.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more line items to a draft Stripe invoice in a single call. Each line supplies either a price ID or an ad-hoc amount (smallest currency unit) plus currency, with an optional description and quantity. Use to populate a draft before Finalize Invoice. Not idempotent: each call appends new lines.',
    idempotent: false,
  },
  props: {
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'The draft invoice ID (e.g., in_...). Obtain it from List/Search Invoices.',
      required: true,
    }),
    lines: Property.Array({
      displayName: 'Lines',
      description: 'The line items to add to the invoice.',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          required: false,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          description:
            'Ad-hoc amount in the smallest currency unit (e.g., 1050 for $10.50), in the invoice\'s currency. Provide either an Amount or a Price ID (not both).',
          required: false,
        }),
        price: Property.ShortText({
          displayName: 'Price ID',
          description: 'A price ID (e.g., price_...) instead of an ad-hoc amount.',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { invoice_id, lines } = context.propsValue;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw new Error('Provide at least one line item to add.');
    }

    const body: { [key: string]: unknown } = {};
    (lines as Array<Record<string, unknown>>).forEach((line, index) => {
      if (line.description !== undefined && line.description !== null && line.description !== '') {
        body[`lines[${index}][description]`] = line.description;
      }
      // Stripe accepts EITHER a price (referenced via the nested `pricing[price]`
      // object) OR an ad-hoc `amount` per line — not both. quantity is only valid
      // with a price line; ad-hoc amount lines take neither quantity nor currency
      // (they inherit the invoice currency).
      if (line.price) {
        body[`lines[${index}][pricing][price]`] = line.price;
        if (line.quantity !== undefined && line.quantity !== null) {
          body[`lines[${index}][quantity]`] = line.quantity;
        }
      } else if (line.amount !== undefined && line.amount !== null) {
        body[`lines[${index}][amount]`] = line.amount;
      }
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}/add_lines`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});

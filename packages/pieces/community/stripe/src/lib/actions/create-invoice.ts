import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { invoiceOutputSchema } from '../output-schemas';
export const stripeCreateInvoice = createAction({
  name: 'create_invoice',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Create Invoice',
  description: 'Create a draft invoice for a customer.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a draft invoice in Stripe for an existing customer in the given currency. Use to bill a customer for pending invoice items. Requires a valid Stripe customer ID; not idempotent, as each call creates a separate invoice.',
    idempotent: false,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: "Starts with cus_. Find it on the customer's page in Stripe.",
      required: true,
      placeholder: 'cus_...',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency code, e.g. usd or eur.',
      required: true,
      placeholder: 'usd',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Memo shown to the customer on the invoice.',
      required: false,
    }),
  },
  outputSchema: invoiceOutputSchema,
  async run(context) {
    const invoice = {
      customer: context.propsValue.customer_id,
      currency: context.propsValue.currency,
      description: context.propsValue.description,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/invoices',
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeCommon.toFormBody({
        customer: invoice.customer,
        currency: invoice.currency,
        description: invoice.description,
      }),
    });
    return response.body;
  },
});

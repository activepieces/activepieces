import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const stripeCreateInvoiceAi = createAction({
  name: 'create_invoice_ai',
  auth: stripeAuth,
  displayName: 'Create Invoice (Agent)',
  description: 'Create a draft invoice in Stripe.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a draft invoice for an existing customer in the given currency. Use to bill a customer for pending invoice items; add lines with Create Invoice Item / Add Invoice Lines, then Finalize Invoice and Send Invoice. Requires a valid customer ID. Not idempotent: each call creates a separate invoice.',
    idempotent: false,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...). Obtain it from Search Customers or List Customers.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., usd).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the invoice.',
      required: false,
    }),
    collection_method: Property.StaticDropdown({
      displayName: 'Collection Method',
      description:
        "How to collect payment. 'charge_automatically' (default) charges the customer's default payment method when finalized; 'send_invoice' emails the customer a payable invoice (requires Days Until Due) and is the only method that lets you later call Send Invoice.",
      required: false,
      options: {
        options: [
          { label: 'Charge automatically', value: 'charge_automatically' },
          { label: 'Send invoice (email)', value: 'send_invoice' },
        ],
      },
    }),
    days_until_due: Property.Number({
      displayName: 'Days Until Due',
      description:
        "Number of days until the invoice is due. Required when Collection Method is 'send_invoice'.",
      required: false,
    }),
  },
  async run(context) {
    const { customer_id, currency, description, collection_method, days_until_due } =
      context.propsValue;

    if (
      collection_method === 'send_invoice' &&
      (days_until_due === undefined || days_until_due === null)
    ) {
      throw new Error(
        "days_until_due is required when collection_method is 'send_invoice'."
      );
    }

    const body: { [key: string]: unknown } = {
      customer: customer_id,
      currency,
    };
    if (description) body.description = description;
    if (collection_method) body.collection_method = collection_method;
    if (
      collection_method === 'send_invoice' &&
      days_until_due !== undefined &&
      days_until_due !== null
    ) {
      body.days_until_due = days_until_due;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/invoices',
      headers: {
        Authorization: 'Bearer ' + context.auth.secret_text,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return response.body;
  },
});

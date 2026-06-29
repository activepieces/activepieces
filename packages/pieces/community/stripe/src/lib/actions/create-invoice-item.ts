import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateInvoiceItem = createAction({
  name: 'create_invoice_item',
  auth: stripeAuth,
  displayName: 'Create Invoice Item (Agent)',
  description: 'Add a one-off pending line item to a customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a pending invoice item for a customer that attaches to their next invoice, or to a specific invoice if one is given. Amount is in the smallest currency unit (e.g. cents) — pass a raw integer, not a decimal. Use to add ad-hoc charges before invoicing. Not idempotent: each call creates a new item.',
    idempotent: false,
  },
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'The Stripe customer ID (e.g., cus_...). Obtain it from Search/List Customers.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description:
        'The amount in the smallest currency unit (e.g., 1050 for $10.50). Raw integer, not a decimal.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The three-letter ISO currency code (e.g., usd).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    invoice: Property.ShortText({
      displayName: 'Invoice ID',
      description:
        'Attach to this specific draft invoice (in_...) instead of the next upcoming one.',
      required: false,
    }),
    price: Property.ShortText({
      displayName: 'Price ID',
      description:
        'Use a price ID (price_...) instead of an ad-hoc amount. If set, leave Amount/Currency blank.',
      required: false,
    }),
  },
  async run(context) {
    const { customer, amount, currency, description, invoice, price } =
      context.propsValue;

    const body: { [key: string]: unknown } = {
      customer,
    };

    if (price) {
      body.price = price;
    } else {
      body.amount = amount;
      body.currency = currency;
    }
    if (description) body.description = description;
    if (invoice) body.invoice = invoice;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/invoiceitems`,
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

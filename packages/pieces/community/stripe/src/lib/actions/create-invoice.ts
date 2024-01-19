import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';

export const stripeCreateInvoice = createAction({
  name: 'create_invoice',
  auth: stripeAuth,
  displayName: 'Create Invoice',
  description: 'Create an Invoice in stripe',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Stripe Customer ID',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency for the invoice (e.g., USD)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the invoice',
      required: false,
    }),
  },
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
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        customer: invoice.customer,
        currency: invoice.currency,
        description: invoice.description,
      },
    });
    return response.body;
  },
});

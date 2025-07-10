import { createAction, Property } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createPaymentLinkAction = createAction({
  name: 'create_payment_link',
  auth: checkoutComAuth,
  displayName: 'Create Payment Link',
  description: 'Send payment link via email or SMS to a client.',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      required: false,
    }),
    customerPhone: Property.ShortText({
      displayName: 'Customer Phone',
      required: false,
    }),
    expiresIn: Property.Number({
      displayName: 'Expires In (seconds)',
      required: false,
    }),
  },
  async run(context) {
    const { amount, currency, reference, description, customerEmail, customerName, customerPhone, expiresIn } = context.propsValue;
    const body: Record<string, any> = {
      amount,
      currency,
    };
    if (reference) body.reference = reference;
    if (description) body.description = description;
    if (customerEmail || customerName || customerPhone) {
      body.customer = {};
      if (customerEmail) body.customer.email = customerEmail;
      if (customerName) body.customer.name = customerName;
      if (customerPhone) body.customer.phone = customerPhone;
    }
    if (expiresIn) body.expires_in = expiresIn;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.checkout.com/payment-links',
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 
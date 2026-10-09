import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ikhokhaAuth } from '../auth';
import { ikhokhaRequest } from '../common/client';

export const createPaymentLinkAction = createAction({
  auth: ikhokhaAuth,
  name: 'create_payment_link',
  displayName: 'Create Payment Link',
  description: 'Generate an iKhokha payment link for a customer.',
  props: {
    amount: Property.Number({
      displayName: 'Amount (ZAR)',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your own order or invoice reference.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Where iKhokha should notify about the result.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const amountCents = Math.round(Number(propsValue.amount) * 100);
    return ikhokhaRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/public/v1/payment-links',
      body: {
        amount: amountCents,
        currency: 'ZAR',
        externalReference: propsValue.reference,
        description: propsValue.description ?? '',
        customerEmail: propsValue.customer_email,
        callbackUrl: propsValue.callback_url,
      },
    });
  },
});

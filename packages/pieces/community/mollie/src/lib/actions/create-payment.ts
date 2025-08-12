import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createPaymentAction = createAction({
  auth: mollieAuth,
  name: 'create_payment',
  displayName: 'Create Payment',
  description: 'Creates a new payment in Mollie',
  props: {
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Payment amount (e.g., 10.50)',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'Payment currency',
      required: true,
      defaultValue: 'EUR',
      options: {
        options: [
          { label: 'EUR', value: 'EUR' },
          { label: 'USD', value: 'USD' },
          { label: 'GBP', value: 'GBP' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Payment description',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect after payment',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for payment status webhooks',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Existing customer ID',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Custom metadata as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });
    
    const paymentData = {
      amount: {
        currency: context.propsValue.currency,
        value: context.propsValue.amount,
      },
      description: context.propsValue.description,
      redirectUrl: context.propsValue.redirectUrl,
      webhookUrl: context.propsValue.webhookUrl,
      customerId: context.propsValue.customerId,
      metadata: context.propsValue.metadata,
    };

    return await api.createPayment(paymentData);
  },
});
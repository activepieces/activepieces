import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createPaymentLinkAction = createAction({
  auth: mollieAuth,
  name: 'create_payment_link',
  displayName: 'Create Payment Link',
  description: 'Generate a new payment link targeting a customer, product, or specific amount',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Payment amount',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
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
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the payment link expires',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL for payment status webhooks',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ apiKey: context.auth });
    
    const paymentLinkData = {
      amount: {
        currency: context.propsValue.currency,
        value: context.propsValue.amount.toFixed(2),
      },
      description: context.propsValue.description,
      expiresAt: context.propsValue.expiresAt,
      webhookUrl: context.propsValue.webhookUrl,
    };

    return await api.createPaymentLink(paymentLinkData);
  },
});
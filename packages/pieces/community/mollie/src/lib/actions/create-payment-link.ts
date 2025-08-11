import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';

export const mollieCreatePaymentLink = createAction({
  auth: mollieAuth,
  name: 'create_payment_link',
  displayName: 'Create Payment Link',
  description: 'Create a payment link that can be shared with customers',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to be paid (e.g., 10.00)',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency of the payment',
      required: true,
      options: {
        options: [
          { label: 'Euro', value: 'EUR' },
          { label: 'US Dollar', value: 'USD' },
          { label: 'British Pound', value: 'GBP' },
          { label: 'Canadian Dollar', value: 'CAD' },
          { label: 'Australian Dollar', value: 'AUD' },
          { label: 'Japanese Yen', value: 'JPY' },
          { label: 'Swiss Franc', value: 'CHF' },
          { label: 'Swedish Krona', value: 'SEK' },
          { label: 'Norwegian Krone', value: 'NOK' },
          { label: 'Danish Krone', value: 'DKK' },
          { label: 'Polish Zloty', value: 'PLN' },
        ],
      },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A description of the payment link',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'The URL to redirect the customer to after the payment',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'The URL that will receive webhook notifications',
      required: false,
    }),
    expiresAfterDays: Property.Number({
      displayName: 'Expires After (Days)',
      description: 'Number of days until the payment link expires',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const amountValue = context.propsValue.amount.toFixed(2);
    
    const paymentLinkData: any = {
      amount: {
        currency: context.propsValue.currency,
        value: amountValue,
      },
      description: context.propsValue.description,
    };

    if (context.propsValue.redirectUrl) {
      paymentLinkData.redirectUrl = context.propsValue.redirectUrl;
    }

    if (context.propsValue.webhookUrl) {
      paymentLinkData.webhookUrl = context.propsValue.webhookUrl;
    }

    if (context.propsValue.expiresAfterDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + context.propsValue.expiresAfterDays);
      paymentLinkData.expiresAt = expiresAt.toISOString();
    }

    const paymentLink = await mollieCommon.createResource(
      context.auth,
      'payment-links',
      paymentLinkData
    );

    return paymentLink;
  },
});
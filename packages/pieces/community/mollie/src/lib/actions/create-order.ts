import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MollieOrder } from '../common';

export const mollieCreateOrder = createAction({
  auth: mollieAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order (Note: Consider using Create Payment as orders API is deprecated)',
  props: {
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The total amount of the order (e.g., 10.00)',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'The currency of the order',
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
    billingAddress: Property.Json({
      displayName: 'Billing Address',
      description: 'Billing address object with streetAndNumber, postalCode, city, country, and optional region',
      required: true,
    }),
    lines: Property.Json({
      displayName: 'Order Lines',
      description: 'Array of order line objects with name, quantity, unitPrice, and totalAmount',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'The URL to redirect the customer to after the order',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'The URL that will receive webhook notifications',
      required: false,
    }),
    method: Property.StaticDropdown({
      displayName: 'Payment Method',
      description: 'Force a specific payment method',
      required: false,
      options: {
        options: [
          { label: 'Any (Let customer choose)', value: '' },
          { label: 'iDEAL', value: 'ideal' },
          { label: 'Credit Card', value: 'creditcard' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Bancontact', value: 'bancontact' },
          { label: 'SOFORT Banking', value: 'sofort' },
          { label: 'Bank Transfer', value: 'banktransfer' },
          { label: 'SEPA Direct Debit', value: 'directdebit' },
        ],
      },
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The locale to use for the checkout page',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en_US' },
          { label: 'Dutch', value: 'nl_NL' },
          { label: 'Dutch (Belgium)', value: 'nl_BE' },
          { label: 'French', value: 'fr_FR' },
          { label: 'French (Belgium)', value: 'fr_BE' },
          { label: 'German', value: 'de_DE' },
          { label: 'German (Austria)', value: 'de_AT' },
          { label: 'German (Switzerland)', value: 'de_CH' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to attach to the order',
      required: false,
    }),
  },
  async run(context) {
    const amountValue = context.propsValue.amount.toFixed(2);

    const orderData: any = {
      amount: {
        currency: context.propsValue.currency,
        value: amountValue,
      },
      billingAddress: context.propsValue.billingAddress,
      lines: context.propsValue.lines,
    };

    if (context.propsValue.redirectUrl) {
      orderData.redirectUrl = context.propsValue.redirectUrl;
    }

    if (context.propsValue.webhookUrl) {
      orderData.webhookUrl = context.propsValue.webhookUrl;
    }

    if (context.propsValue.method) {
      orderData.method = context.propsValue.method;
    }

    if (context.propsValue.locale) {
      orderData.locale = context.propsValue.locale;
    }

    if (context.propsValue.metadata) {
      orderData.metadata = context.propsValue.metadata;
    }

    const order = await mollieCommon.createResource<MollieOrder>(
      context.auth,
      'orders',
      orderData
    );

    return order;
  },
});
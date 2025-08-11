import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon, MolliePayment } from '../common';

export const mollieCreatePayment = createAction({
  auth: mollieAuth,
  name: 'create_payment',
  displayName: 'Create Payment',
  description: 'Create a new payment',
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
      description: 'A description of the payment',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'The URL to redirect the customer to after the payment',
      required: true,
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
          { label: 'Belfius', value: 'belfius' },
          { label: 'KBC/CBC', value: 'kbc' },
          { label: 'EPS', value: 'eps' },
          { label: 'Giropay', value: 'giropay' },
          { label: 'Przelewy24', value: 'przelewy24' },
          { label: 'Apple Pay', value: 'applepay' },
        ],
      },
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'The locale to use for the payment page',
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
          { label: 'Spanish', value: 'es_ES' },
          { label: 'Italian', value: 'it_IT' },
          { label: 'Portuguese', value: 'pt_PT' },
          { label: 'Swedish', value: 'sv_SE' },
          { label: 'Finnish', value: 'fi_FI' },
          { label: 'Danish', value: 'da_DK' },
          { label: 'Norwegian', value: 'nb_NO' },
          { label: 'Polish', value: 'pl_PL' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Custom metadata to attach to the payment',
      required: false,
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of an existing customer to link to this payment',
      required: false,
    }),
    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      description: 'Indicates the type of payment',
      required: false,
      defaultValue: 'oneoff',
      options: {
        options: [
          { label: 'One-off Payment', value: 'oneoff' },
          { label: 'First Recurring Payment', value: 'first' },
          { label: 'Recurring Payment', value: 'recurring' },
        ],
      },
    }),
  },
  async run(context) {
    const amountValue = context.propsValue.amount.toFixed(2);
    
    const paymentData: any = {
      amount: {
        currency: context.propsValue.currency,
        value: amountValue,
      },
      description: context.propsValue.description,
      redirectUrl: context.propsValue.redirectUrl,
      sequenceType: context.propsValue.sequenceType || 'oneoff',
    };

    if (context.propsValue.webhookUrl) {
      paymentData.webhookUrl = context.propsValue.webhookUrl;
    }

    if (context.propsValue.method) {
      paymentData.method = context.propsValue.method;
    }

    if (context.propsValue.locale) {
      paymentData.locale = context.propsValue.locale;
    }

    if (context.propsValue.metadata) {
      paymentData.metadata = context.propsValue.metadata;
    }

    if (context.propsValue.customerId) {
      paymentData.customerId = context.propsValue.customerId;
    }

    const payment = await mollieCommon.createResource<MolliePayment>(
      context.auth,
      'payments',
      paymentData
    );

    return payment;
  },
});
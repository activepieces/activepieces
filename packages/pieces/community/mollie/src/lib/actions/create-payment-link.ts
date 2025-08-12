import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createPaymentLinkAction = createAction({
  auth: mollieAuth,
  name: 'create_payment_link',
  displayName: 'Create Payment Link',
  description: 'Generate a new payment link targeting a customer, product, or specific amount',
  props: {
    amount_currency: Property.StaticDropdown({
      displayName: 'Amount Currency',
      required: false,
      defaultValue: 'EUR',
      options: { options: [{ label: 'EUR', value: 'EUR' }, { label: 'USD', value: 'USD' }, { label: 'GBP', value: 'GBP' }] },
    }),
    amount_value: Property.ShortText({
      displayName: 'Amount Value',
      description: 'Exact amount string with 2 decimals (e.g. 10.00)',
      required: false,
    }),
    minimumAmount_currency: Property.StaticDropdown({
      displayName: 'Minimum Amount Currency',
      required: false,
      defaultValue: 'EUR',
      options: { options: [{ label: 'EUR', value: 'EUR' }, { label: 'USD', value: 'USD' }, { label: 'GBP', value: 'GBP' }] },
    }),
    minimumAmount_value: Property.ShortText({
      displayName: 'Minimum Amount Value',
      description: 'Exact amount string with 2 decimals (e.g. 1.00). Only when no amount is set.',
      required: false,
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
    lines: Property.Array({
      displayName: 'Lines',
      description: 'List of items in the payment link',
      required: false,

    }),
    allowedMethods: Property.StaticMultiSelectDropdown({
      displayName: 'Allowed Methods',
      required: false,
      options: {
        options: [
          { label: 'applepay', value: 'applepay' }, { label: 'bancomatpay', value: 'bancomatpay' }, { label: 'bancontact', value: 'bancontact' },
          { label: 'banktransfer', value: 'banktransfer' }, { label: 'belfius', value: 'belfius' }, { label: 'blik', value: 'blik' },
          { label: 'creditcard', value: 'creditcard' }, { label: 'eps', value: 'eps' }, { label: 'giftcard', value: 'giftcard' },
          { label: 'ideal', value: 'ideal' }, { label: 'kbc', value: 'kbc' }, { label: 'mybank', value: 'mybank' },
          { label: 'paybybank', value: 'paybybank' }, { label: 'paypal', value: 'paypal' }, { label: 'paysafecard', value: 'paysafecard' },
          { label: 'pointofsale', value: 'pointofsale' }, { label: 'przelewy24', value: 'przelewy24' }, { label: 'satispay', value: 'satispay' },
          { label: 'trustly', value: 'trustly' }, { label: 'twint', value: 'twint' }, { label: 'in3', value: 'in3' },
          { label: 'riverty', value: 'riverty' }, { label: 'klarna', value: 'klarna' }, { label: 'billie', value: 'billie' },
        ]
      },
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      required: false
    }),
    reusable: Property.Checkbox({
      displayName: 'Reusable',
      required: false
    }),
    sequenceType: Property.StaticDropdown({
      displayName: 'Sequence Type',
      required: false,
      defaultValue: 'oneoff',
      options: {
        options: [{
          label: 'oneoff',
          value: 'oneoff'
        },
        {
          label:
            'first',
          value: 'first'
        }]
      },
    }),
    customerId: Property.ShortText({
      displayName: 'Customer ID (required if first)',
      required: false
    }),
    applicationFee_amount_currency: Property.StaticDropdown({
      displayName: 'Application Fee Currency',
      required: false,
      options: {
        options:
          [{
            label: 'EUR',
            value: 'EUR'
          }, {
            label: 'USD',
            value: 'USD'
          }, {
            label: 'GBP',
            value: 'GBP'
          }]
      },
    }),
    applicationFee_amount_value:
      Property.ShortText({
        displayName: 'Application Fee Value',
        required: false
      }),
    applicationFee_description:
      Property.ShortText({
        displayName: 'Application Fee Description',
        required: false
      }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });

    const paymentLinkData = {
      amount: {
        currency: context.propsValue.amount_currency,
        value: context.propsValue.amount_value,
      },
      lines: context.propsValue.lines,
      description: context.propsValue.description,
      expiresAt: context.propsValue.expiresAt,
      webhookUrl: context.propsValue.webhookUrl,
      allowedMethods: context.propsValue.allowedMethods,
      minimumAmount: {
        currency: context.propsValue.minimumAmount_currency,
        value: context.propsValue.minimumAmount_value,
      },
      reusable: context.propsValue.reusable,
      sequenceType: context.propsValue.sequenceType,
      customerId: context.propsValue.customerId,
      applicationFee: {
        amount: {
          currency: context.propsValue.applicationFee_amount_currency,
          value: context.propsValue.applicationFee_amount_value,
        },
        description: context.propsValue.applicationFee_description,
      },
      profileId: context.propsValue.profileId,
    };

    return await api.createPaymentLink(paymentLinkData);
  },
});
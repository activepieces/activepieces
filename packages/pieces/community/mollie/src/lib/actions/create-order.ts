import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createOrderAction = createAction({
  auth: mollieAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order in Mollie (Note: Order API is deprecated, use Payments API instead)',
  props: {
    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description: 'Your internal order number',
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
    amount: Property.ShortText({
      displayName: 'Total Amount',
      description: 'Exact amount string with 2 decimals (e.g. 1000.00, 10.99)',
      required: true,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      required: false,
    }),
    billingAddress: Property.Object({
      displayName: 'Billing Address',
      description: 'Customer billing address',
      required: true,
    }),
    shippingAddress: Property.Object({
      displayName: 'Shipping Address',
      description: 'Customer shipping address',
      required: false,
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'Language for the order',
      required: true,
      defaultValue: 'en_US',
      options: {
        options: [
          { label: 'en_US', value: 'en_US' }, { label: 'en_GB', value: 'en_GB' }, { label: 'nl_NL', value: 'nl_NL' },
          { label: 'nl_BE', value: 'nl_BE' }, { label: 'de_DE', value: 'de_DE' }, { label: 'de_AT', value: 'de_AT' },
          { label: 'de_CH', value: 'de_CH' }, { label: 'fr_FR', value: 'fr_FR' }, { label: 'fr_BE', value: 'fr_BE' },
          { label: 'es_ES', value: 'es_ES' }, { label: 'ca_ES', value: 'ca_ES' }, { label: 'pt_PT', value: 'pt_PT' },
          { label: 'it_IT', value: 'it_IT' }, { label: 'nb_NO', value: 'nb_NO' }, { label: 'sv_SE', value: 'sv_SE' },
          { label: 'fi_FI', value: 'fi_FI' }, { label: 'da_DK', value: 'da_DK' }, { label: 'is_IS', value: 'is_IS' },
          { label: 'hu_HU', value: 'hu_HU' }, { label: 'pl_PL', value: 'pl_PL' }, { label: 'lv_LV', value: 'lv_LV' },
          { label: 'lt_LT', value: 'lt_LT' },
        ]
      },
    }),
    method: Property.StaticMultiSelectDropdown({
      displayName: 'Payment Methods',
      required: false,
      options: {
        options: [
          { label: 'applepay', value: 'applepay' }, { label: 'bancomatpay', value: 'bancomatpay' },
          { label: 'bancontact', value: 'bancontact' }, { label: 'banktransfer', value: 'banktransfer' },
          { label: 'belfius', value: 'belfius' }, { label: 'billie', value: 'billie' },
          { label: 'creditcard', value: 'creditcard' }, { label: 'directdebit', value: 'directdebit' },
          { label: 'eps', value: 'eps' }, { label: 'giftcard', value: 'giftcard' }, { label: 'ideal', value: 'ideal' },
          { label: 'in3', value: 'in3' }, { label: 'kbc', value: 'kbc' }, { label: 'klarna', value: 'klarna' },
          { label: 'klarnapaylater', value: 'klarnapaylater' }, { label: 'klarnapaynow', value: 'klarnapaynow' },
          { label: 'klarnasliceit', value: 'klarnasliceit' }, { label: 'mybank', value: 'mybank' },
          { label: 'paypal', value: 'paypal' }, { label: 'paysafecard', value: 'paysafecard' },
          { label: 'przelewy24', value: 'przelewy24' }, { label: 'riverty', value: 'riverty' },
          { label: 'satispay', value: 'satispay' }, { label: 'trustly', value: 'trustly' }, { label: 'twint', value: 'twint' },
          { label: 'voucher', value: 'voucher' },
        ]
      },
    }),
    shopperCountryMustMatchBillingCountry: Property.Checkbox({ displayName: 'Shopper Country Must Match Billing', required: false }),
    metadata: Property.Object({ displayName: 'Metadata', required: false }),
    profileId: Property.ShortText({ displayName: 'Profile ID', required: false }),
    expiresAt: Property.ShortText({ displayName: 'Expires At (YYYY-MM-DD)', required: false }),
    consumerDateOfBirth: Property.ShortText({ displayName: 'Consumer DOB (YYYY-MM-DD)', required: false }),
    testmode: Property.Checkbox({ displayName: 'Test Mode', required: false }),
    embed: Property.StaticMultiSelectDropdown({
      displayName: 'Embed in response', required: false,
      options: { options: [{ label: 'payments', value: 'payments' }, { label: 'refunds', value: 'refunds' }, { label: 'shipments', value: 'shipments' }] },
    }),
    orderLines: Property.Array({
      displayName: 'Order Lines',
      description: 'List of items in the order',
      required: true,
    }),
  },
  async run(context) {
    const api = new MollieApi({ accessToken: context.auth.access_token });

    const orderData = {
      amount: {
        currency: context.propsValue.currency,
        value: context.propsValue.amount,
      },
      orderNumber: context.propsValue.orderNumber,
      billingAddress: context.propsValue.billingAddress,
      shippingAddress: context.propsValue.shippingAddress,
      redirectUrl: context.propsValue.redirectUrl,
      webhookUrl: context.propsValue.webhookUrl,
      lines: context.propsValue.orderLines,
      locale:context.propsValue.locale,
      method: context.propsValue.method,
      shopperCountryMustMatchBillingCountry: context.propsValue.shopperCountryMustMatchBillingCountry,
      metadata: context.propsValue.metadata,
      profileId: context.propsValue.profileId,
      expiresAt: context.propsValue.expiresAt,
      consumerDateOfBirth: context.propsValue.consumerDateOfBirth,
      testmode: context.propsValue.testmode,
      embed: context.propsValue.embed,
    };

    return await api.createOrder(orderData);
  },
});
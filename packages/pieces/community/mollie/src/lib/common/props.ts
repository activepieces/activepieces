import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const localeDropdown = Property.StaticDropdown({
  displayName: 'Locale',
  description:
    'Language to be used in the hosted payment pages shown to the customer',
  required: false,
  options: {
    options: [
      { label: 'English (US)', value: 'en_US' },
      { label: 'English (GB)', value: 'en_GB' },
      { label: 'Dutch (Netherlands)', value: 'nl_NL' },
      { label: 'Dutch (Belgium)', value: 'nl_BE' },
      { label: 'German (Germany)', value: 'de_DE' },
      { label: 'German (Austria)', value: 'de_AT' },
      { label: 'German (Switzerland)', value: 'de_CH' },
      { label: 'French (France)', value: 'fr_FR' },
      { label: 'French (Belgium)', value: 'fr_BE' },
      { label: 'Spanish (Spain)', value: 'es_ES' },
      { label: 'Catalan (Spain)', value: 'ca_ES' },
      { label: 'Portuguese (Portugal)', value: 'pt_PT' },
      { label: 'Italian (Italy)', value: 'it_IT' },
      { label: 'Norwegian (Norway)', value: 'nb_NO' },
      { label: 'Swedish (Sweden)', value: 'sv_SE' },
      { label: 'Finnish (Finland)', value: 'fi_FI' },
      { label: 'Danish (Denmark)', value: 'da_DK' },
      { label: 'Icelandic (Iceland)', value: 'is_IS' },
      { label: 'Hungarian (Hungary)', value: 'hu_HU' },
      { label: 'Polish (Poland)', value: 'pl_PL' },
      { label: 'Latvian (Latvia)', value: 'lv_LV' },
      { label: 'Lithuanian (Lithuania)', value: 'lt_LT' },
    ],
  },
});

export const currencyDropdown = Property.StaticDropdown({
  displayName: 'Currency',
  description: 'Three-letter ISO currency code',
  required: true,
  options: {
    options: [
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'USD - US Dollar', value: 'USD' },
      { label: 'GBP - British Pound', value: 'GBP' },
      { label: 'CHF - Swiss Franc', value: 'CHF' },
      { label: 'PLN - Polish Zloty', value: 'PLN' },
      { label: 'SEK - Swedish Krona', value: 'SEK' },
      { label: 'DKK - Danish Krone', value: 'DKK' },
      { label: 'NOK - Norwegian Krone', value: 'NOK' },
    ],
  },
});


export const paymentMethodDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Payment Method',
  description: 'Force a specific payment method',
  required: false,
  options: {
    options: [
      { label: 'Apple Pay', value: 'applepay' },
      { label: 'Bancomatpay', value: 'bancomatpay' },
      { label: 'Bancontact', value: 'bancontact' },
      { label: 'Bank Transfer', value: 'banktransfer' },
      { label: 'Belfius Pay Button', value: 'belfius' },
      { label: 'BLIK', value: 'blik' },
      { label: 'Credit Card', value: 'creditcard' },
      { label: 'EPS', value: 'eps' },
      { label: 'Gift Card', value: 'giftcard' },
      { label: 'iDEAL', value: 'ideal' },
      { label: 'KBC/CBC Payment Button', value: 'kbc' },
      { label: 'MyBank', value: 'mybank' },
      { label: 'Pay by Bank', value: 'paybybank' },
      { label: 'PayPal', value: 'paypal' },
      { label: 'Paysafecard', value: 'paysafecard' },
      { label: 'Point of Sale', value: 'pointofsale' },
      { label: 'Przelewy24', value: 'przelewy24' },
      { label: 'Satispay', value: 'satispay' },
      { label: 'Trustly', value: 'trustly' },
      { label: 'Twint', value: 'twint' },
      { label: 'in3', value: 'in3' },
      { label: 'Riverty', value: 'riverty' },
      { label: 'Klarna', value: 'klarna' },
      { label: 'Billie', value: 'billie' },
    ],
  },
});

export const paymentIdDropdown = Property.Dropdown({
  displayName: 'Payment ID',
  description: 'Select a payment ',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/payments'
      );
      return {
        disabled: false,
        options: response._embedded.payments.map((payment: any) => ({
          label: payment.description,
          value: payment.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer ID',
  description: 'Select a customer to associate with this payment',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/customers'
      );
      return {
        disabled: false,
        options: response._embedded.customers.map((customer: any) => ({
          label: customer.name || customer.id,
          value: customer.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading customers',
      };
    }
  },
});

export const mandatesIdDropdown = Property.Dropdown({
  displayName: 'Mandate ID',
  description: 'Select a mandate for recurring payments',
  required: false,

  refreshers: ['auth', 'customerId'],
  options: async ({ auth, customerId }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!customerId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a customer first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `customers/${customerId}/mandates`
      );
      return {
        disabled: false,
        options: response._embedded.mandates.map((mandate: any) => ({
          label: mandate.description || mandate.id,
          value: mandate.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading mandates',
      };
    }
  },
});

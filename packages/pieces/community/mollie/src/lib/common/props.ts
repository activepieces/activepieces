import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

interface MollieMethod {
  id: string;
  description: string;
}

interface MolliePayment {
  id: string;
  description: string;
}

interface MollieProfile {
  id: string;
  name?: string;
}

interface MollieCustomer {
  id: string;
  name?: string;
}

interface MollieMandate {
  id: string;
  description?: string;
}

interface MollieApiResponse<T> {
  count: number;
  _embedded: {
    methods?: T[];
    payments?: T[];
    profiles?: T[];
    customers?: T[];
    mandates?: T[];
  };
}

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

export const currencyDropdown = (name: string, required = false) =>
  Property.StaticDropdown({
    displayName: name,
    description: 'ISO 4217 currency for the fixed amount (optional)',
    required: required,
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
  displayName: 'Allowed Payment Methods',
  description: 'Select which payment methods are allowed for this payment link. Leave empty to allow all enabled methods.',
  required: false,
  options: {
    options: [
      { label: 'Apple Pay', value: 'applepay' },
      { label: 'BACS Direct Debit', value: 'bacs' },
      { label: 'Bancomat Pay', value: 'bancomatpay' },
      { label: 'Bancontact', value: 'bancontact' },
      { label: 'Bank Transfer', value: 'banktransfer' },
      { label: 'Belfius Pay Button', value: 'belfius' },
      { label: 'Billie', value: 'billie' },
      { label: 'Bizum', value: 'bizum' },
      { label: 'Blik', value: 'blik' },
      { label: 'Credit/Debit Card', value: 'creditcard' },
      { label: 'Direct Debit', value: 'directdebit' },
      { label: 'EPS', value: 'eps' },
      { label: 'Gift Card', value: 'giftcard' },
      { label: 'iDEAL', value: 'ideal' },
      { label: 'in3', value: 'in3' },
      { label: 'KBC Payment Button', value: 'kbc' },
      { label: 'Klarna', value: 'klarna' },
      { label: 'Klarna Pay Later', value: 'klarnapaylater' },
      { label: 'Klarna Pay Now', value: 'klarnapaynow' },
      { label: 'Klarna Slice It', value: 'klarnasliceit' },
      { label: 'MB WAY', value: 'mbway' },
      { label: 'Multibanco', value: 'multibanco' },
      { label: 'MyBank', value: 'mybank' },
      { label: 'Pay by Bank', value: 'paybybank' },
      { label: 'Payconiq', value: 'payconiq' },
      { label: 'PayPal', value: 'paypal' },
      { label: 'Paysafecard', value: 'paysafecard' },
      { label: 'Point of Sale', value: 'pointofsale' },
      { label: 'Przelewy24', value: 'przelewy24' },
      { label: 'Riverty', value: 'riverty' },
      { label: 'Satispay', value: 'satispay' },
      { label: 'Swish', value: 'swish' },
      { label: 'Trustly', value: 'trustly' },
      { label: 'Twint', value: 'twint' },
      { label: 'Voucher', value: 'voucher' },
    ],
  },
});

export const paymentIdDropdown = Property.Dropdown({
  displayName: 'Payment ID',
  description: 'Select a payment ',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        '/payments'
      ) as MollieApiResponse<MolliePayment>;
      return {
        disabled: false,
        options: response._embedded.payments?.map((payment: MolliePayment) => ({
          label: payment.description,
          value: payment.id,
        })) || [],
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
export const profileIdDropdown = Property.Dropdown({
  displayName: 'Profile ID',
  description: 'Select a profile to associate with this payment',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        '/profiles'
      ) as MollieApiResponse<MollieProfile>;
      return {
        disabled: false,
        options: response._embedded.profiles?.map((profile: MollieProfile) => ({
          label: profile.name || profile.id,
          value: profile.id,
        })) || [],
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading profiles',
      };
    }
  },
});
export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer ID',
  description: 'Select a customer to associate with this payment',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: { auth?: { access_token: string } }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth.access_token,
        HttpMethod.GET,
        '/customers'
      ) as MollieApiResponse<MollieCustomer>;
      return {
        disabled: false,
        options: response._embedded.customers?.map((customer: MollieCustomer) => ({
          label: customer.name || customer.id,
          value: customer.id,
        })) || [],
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
  options: async ({
    auth,
    customerId,
  }: {
    auth?: { access_token: string };
    customerId?: string;
  }) => {
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
        auth.access_token,
        HttpMethod.GET,
        `/customers/${customerId}/mandates`
      ) as MollieApiResponse<MollieMandate>;
      return {
        disabled: false,
        options: response._embedded.mandates?.map((mandate: MollieMandate) => ({
          label: mandate.description || mandate.id,
          value: mandate.id,
        })) || [],
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

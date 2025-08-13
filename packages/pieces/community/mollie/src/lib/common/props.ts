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

export const paymentMethodDropdown = Property.Dropdown({
  displayName: 'Payment Method',
  description: 'Force a specific payment method',
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
        '/methods'
      );
      return {
        disabled: false,
        options: response._embedded.paymentMethods.map((method: any) => ({
          label: method.description,
          value: method.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading payment methods',
      };
    }
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
      );
      return {
        disabled: false,
        options: response._embedded.profiles.map((profile: any) => ({
          label: profile.name || profile.id,
          value: profile.id,
        })),
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

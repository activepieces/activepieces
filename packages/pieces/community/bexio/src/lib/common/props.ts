import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { BexioClient } from './client';
import { BexioAccount, BexioTax, BexioCurrency } from './types';
import { bexioAuth } from '../..';

export const bexioCommonProps = {
  account: (options: {
    displayName: string;
    description?: string;
    required: boolean;
  }) => {
    return Property.Dropdown({
      auth: bexioAuth,
      displayName: options.displayName,
      description: options.description,
      required: options.required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const accounts = await client.get<BexioAccount[]>('/accounts');

          return {
            disabled: false,
            options: accounts.map((account) => ({
              label: `${account.account_no} - ${account.name}`,
              value: account.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load accounts',
            options: [],
          };
        }
      },
    });
  },

  tax: Property.Dropdown({
    auth: bexioAuth,
    displayName: 'Tax',
    description: 'Select a tax rate',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Bexio account first',
          options: [],
        };
      }

      try {
        const client = new BexioClient(auth);
        const taxes = await client.get<BexioTax[]>('/taxes');

        return {
          disabled: false,
          options: taxes.map((tax) => ({
            label: `${tax.name} (${tax.percentage}%)`,
            value: tax.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load taxes',
          options: [],
        };
      }
    },
  }),

  currency: (options: {
    displayName: string;
    description?: string;
    required: boolean;
  }) => {
    return Property.Dropdown({
      auth: bexioAuth,
      displayName: options.displayName,
      description: options.description,
      required: options.required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Bexio account first',
            options: [],
          };
        }

        try {
          const client = new BexioClient(auth);
          const currencies = await client.get<BexioCurrency[]>('/3.0/currencies');

          return {
            disabled: false,
            options: currencies.map((currency) => ({
              label: currency.name,
              value: currency.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load currencies',
            options: [],
          };
        }
      },
    });
  },
};


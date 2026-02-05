import { Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { katanaAuth } from './auth';
import { BASE_URL } from './constants';

interface KatanaCustomer {
  id: number;
  name: string;
}

interface KatanaVariant {
  id: number;
  sku: string;
  name?: string;
}

interface KatanaTaxRate {
  id: number;
  name: string;
  percentage: number;
}

interface KatanaLocation {
  id: number;
  name: string;
}

export const customerDropdown = Property.Dropdown({
  displayName: 'Customer',
  description: 'Select the customer.',
  required: true,
  refreshers: [],
  auth: katanaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<KatanaCustomer[]>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/customers`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
      });

      const customers = Array.isArray(response.body) ? response.body : [];
      return {
        disabled: false,
        options: customers.map((customer) => ({
          label: customer.name,
          value: customer.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Failed to load customers',
        options: [],
      };
    }
  },
});

export const variantDropdown = Property.Dropdown({
  displayName: 'Product Variant',
  description: 'Select the product variant.',
  required: true,
  refreshers: [],
  auth: katanaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<KatanaVariant[]>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/variants`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
      });

      const variants = Array.isArray(response.body) ? response.body : [];
      return {
        disabled: false,
        options: variants.map((variant) => ({
          label: variant.sku || variant.name || `Variant ${variant.id}`,
          value: variant.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Failed to load variants',
        options: [],
      };
    }
  },
});

export const taxRateDropdown = Property.Dropdown({
  displayName: 'Tax Rate',
  required: false,
  refreshers: [],
  auth: katanaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<KatanaTaxRate[]>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/tax_rates`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
      });

      const taxRates = Array.isArray(response.body) ? response.body : [];
      return {
        disabled: false,
        options: taxRates.map((rate) => ({
          label: `${rate.name} (${rate.percentage}%)`,
          value: rate.id,
        })),
      };
    } catch {
      return {
        disabled: false,
        placeholder: 'No tax rates available',
        options: [],
      };
    }
  },
});

export const locationDropdown = Property.Dropdown({
  displayName: 'Location',
  required: false,
  refreshers: [],
  auth: katanaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<KatanaLocation[]>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/locations`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
      });

      const locations = Array.isArray(response.body) ? response.body : [];
      return {
        disabled: false,
        options: locations.map((location) => ({
          label: location.name,
          value: location.id,
        })),
      };
    } catch {
      return {
        disabled: false,
        placeholder: 'No locations available',
        options: [],
      };
    }
  },
});

export const locationDropdownRequired = Property.Dropdown({
  displayName: 'Default Location',
  description: 'Default location for the order.',
  required: true,
  refreshers: [],
  auth: katanaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<KatanaLocation[]>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/locations`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.secret_text,
        },
      });

      const locations = Array.isArray(response.body) ? response.body : [];
      return {
        disabled: false,
        options: locations.map((location) => ({
          label: location.name,
          value: location.id,
        })),
      };
    } catch {
      return {
        disabled: false,
        placeholder: 'No locations available',
        options: [],
      };
    }
  },
});


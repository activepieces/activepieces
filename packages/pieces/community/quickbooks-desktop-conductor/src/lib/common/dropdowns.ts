import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, ConductorAuth } from './client';

/**
 * Shared "pick an existing customer/vendor by name" dropdowns — the same fetch-and-list-by-name
 * logic was copy-pasted across create-invoice.ts, create-bill.ts, and record-payment.ts (4
 * call sites total). `required` and `description` differ per call site (a required top-level
 * pick vs. an optional one relevant to only one mode of a multi-mode action), so these are
 * factories, not shared constants.
 */
export function customerIdDropdown({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    displayName: 'Customer',
    description,
    auth: quickbooksDesktopConductorAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
      const response = await conductorClient.request<{ data: { id: string; fullName: string }[] }>({
        auth: conductorAuth,
        method: HttpMethod.GET,
        resourceUri: '/quickbooks-desktop/customers',
      });
      return { disabled: false, options: response.data.map((customer) => ({ label: customer.fullName, value: customer.id })) };
    },
  });
}

export function vendorIdDropdown({ required, description }: { required: boolean; description: string }) {
  return Property.Dropdown({
    displayName: 'Vendor',
    description,
    auth: quickbooksDesktopConductorAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
      const response = await conductorClient.request<{ data: { id: string; name: string }[] }>({
        auth: conductorAuth,
        method: HttpMethod.GET,
        resourceUri: '/quickbooks-desktop/vendors',
      });
      return { disabled: false, options: response.data.map((vendor) => ({ label: vendor.name, value: vendor.id })) };
    },
  });
}

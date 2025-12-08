import { Property } from '@activepieces/pieces-framework';
import { handleDropdownError } from './constants';
import { bigCommerceApiService } from './requests';
import { bigcommerceAuth } from './auth';

export const customerDropdown = ({ required }: { required: boolean }) =>
  Property.Dropdown({
    auth: bigcommerceAuth,
    displayName: 'Customer',
    description: 'Select the customer',
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await bigCommerceApiService.fetchCustomers({ auth: auth.props });

        const data = Array.isArray(response?.data) ? response.data : [];
        if (data.length === 0) {
          return handleDropdownError('No customers found');
        }

        const options = data.map((user: any) => {
          const fullName =
            [user.first_name, user.last_name]
              .filter((p: any) => typeof p === 'string' && p.trim() !== '')
              .join(' ') ||
            user.email ||
            user.id;

          return {
            label: fullName,
            value: user.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load customers');
      }
    },
  });

export const multiCustomerDropdown = ({ required }: { required: boolean }) =>
  Property.MultiSelectDropdown({
    auth: bigcommerceAuth,
    displayName: 'Customers',
    description: 'Select the customers',
    required,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await bigCommerceApiService.fetchCustomers({ auth: auth.props });

        const data = Array.isArray(response?.data) ? response.data : [];
        if (data.length === 0) {
          return handleDropdownError('No customers found');
        }

        const options = data.map((user: any) => {
          const fullName =
            [user.first_name, user.last_name]
              .filter((p: any) => typeof p === 'string' && p.trim() !== '')
              .join(' ') ||
            user.email ||
            user.id;

          return {
            label: fullName,
            value: user.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load customers');
      }
    },
  });

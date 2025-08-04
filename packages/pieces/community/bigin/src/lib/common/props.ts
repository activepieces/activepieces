import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formatDateTime = (dateTime: string | Date): string => {
  if (typeof dateTime === 'string') {
    return dateTime.replace('.000Z', '+00:00');
  } else {
    const date = new Date(dateTime);
    return date.toISOString().replace('.000Z', '+00:00');
  }
};

export const userIdDropdown = Property.Dropdown({
  displayName: 'User ID',
  description: 'Select the user ',
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
        '/users'
      );
      return {
        disabled: false,
        options: response.users.map((user: any) => ({
          label: user.first_name + ' ' + user.last_name,
          value: user.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading users',
      };
    }
  },
});

// Factory function to create module-specific record dropdowns
export const createRecordIdDropdown = (
  module: string,
  displayName?: string,
  description?: string
) => {
  return Property.Dropdown({
    displayName: displayName || `${module} Record`,
    description: description || `Select the ${module.toLowerCase()} record`,
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
        const accessToken =
          (auth as { access_token?: string })?.access_token ?? (auth as string);
        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/${module}?fields=Last_Name`
        );

        const records = response.data || response[module.toLowerCase()] || [];

        return {
          disabled: false,
          options: records.map((record: any) => ({
            label:
              record.name ||
              record.Last_Name ||
              record.Deal_Name ||
              record.Company_Name ||
              record.Subject ||
              record.id,
            value: record.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Error loading ${module.toLowerCase()} records`,
        };
      }
    },
  });
};


export const contactIdDropdown = createRecordIdDropdown(
  'Contacts',
  'Contact',
  'Select the contact'
);
export const companyIdDropdown = createRecordIdDropdown(
  'Companies',
  'Company',
  'Select the company'
);
export const pipelineIdDropdown = createRecordIdDropdown(
  'Pipelines',
  'Deal',
  'Select the deal/pipeline record'
);
export const taskIdDropdown = createRecordIdDropdown(
  'Tasks',
  'Task',
  'Select the task'
);
export const eventIdDropdown = createRecordIdDropdown(
  'Events',
  'Event',
  'Select the event'
);
export const callIdDropdown = createRecordIdDropdown(
  'Calls',
  'Call',
  'Select the call'
);

export const productidDropdown = createRecordIdDropdown(
  'Products',
  'Product',
  'Select the product'
);
// Keep the original for backward compatibility
export const recordIdDropdown = Property.Dropdown({
  displayName: 'Record ID',
  description: 'Select the record ID',
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
        '/records'
      );
      return {
        disabled: false,
        options: response.records.map((record: any) => ({
          label: record.name || record.id,
          value: record.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading records',
      };
    }
  },
});

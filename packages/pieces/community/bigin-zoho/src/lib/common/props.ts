import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const formatDateTime = (dateTime: string | Date): string => {
  if (typeof dateTime === 'string') {
    return dateTime.replace('.000Z', '+00:00');
  } else {
    const date = new Date(dateTime);
    return date.toISOString().replace('.000Z', '+00:00');
  }
};

export const tagDropdown = (module: string) => {
  return Property.Dropdown({
    displayName: 'Tag',
    description: 'Select a tag for the record',
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
        const typedAuth = auth as {
          access_token: string;
          props?: { [key: string]: any };
        };
        const accessToken = typedAuth.access_token;

        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/settings/tags?module=${module}`,
          typedAuth.props?.['location'] || 'com'
        );
        return {
          disabled: false,
          options: response.tags.map((tag: any) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading tags',
        };
      }
    },
  });
};

export const userIdDropdown = Property.Dropdown({
  displayName: 'User ID',
  description: 'Select the user',
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
      const typedAuth = auth as {
        access_token: string;
        props?: { [key: string]: any };
      };
      const accessToken = typedAuth.access_token;

      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/users',
        typedAuth.props?.['location'] || 'com'
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
      if (!module) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Module not specified',
        };
      }
      try {
        const typedAuth = auth as {
          access_token: string;
          props?: { [key: string]: any };
        };
        const accessToken = typedAuth.access_token;
        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/${module}?fields=Last_Name,First_Name,Deal_Name,Account_Name,Subject,Event_Title,Product_Name`,
          typedAuth.props?.['location'] || 'com'
        );

        const records = response.data || response[module.toLowerCase()] || [];

        return {
          disabled: false,
          options: records.map((record: any) => ({
            label:
              record.name ||
              record.Last_Name ||
              record.Deal_Name ||
              record.Account_Name ||
              record.Subject ||
              record.Event_Title ||
              record.Product_Name ||
              (record.First_Name && record.Last_Name 
                ? `${record.First_Name} ${record.Last_Name}` 
                : record.First_Name || record.Last_Name) ||
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
  'Accounts',
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
      const typedAuth = auth as {
        access_token: string;
        props?: { [key: string]: any };
      };
      const accessToken = typedAuth.access_token;
      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        '/records',
        typedAuth.props?.['location'] || 'com'
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

export const commonProps = {
  firstName: Property.ShortText({
    displayName: 'First Name',
    description: 'First name',
    required: false,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    description: 'Last name',
    required: false,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: 'Email address',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    description: 'Phone number',
    required: false,
  }),
  description: Property.LongText({
    displayName: 'Description',
    description: 'Description',
    required: false,
  }),
}; 
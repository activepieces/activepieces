import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from './auth';

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
  description?: string,
  fields?: string[]
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

        const fieldsToFetch = fields ?? [];
        const fieldsParam = fieldsToFetch.join(',');

        const response = await makeRequest(
          accessToken,
          HttpMethod.GET,
          `/${module}?fields=${fieldsParam}`,
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
              record.Event_Title ||
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
  'Select the contact',
  ['First_Name', 'Last_Name']
);
export const companyIdDropdown = createRecordIdDropdown(
  'Accounts',
  'Company',
  'Select the company',
  ['Account_Name']
);
export const pipelineIdDropdown = createRecordIdDropdown(
  'Pipelines',
  'Deal',
  'Select the deal/pipeline record',
  ['Deal_Name']
);
export const taskIdDropdown = createRecordIdDropdown(
  'Tasks',
  'Task',
  'Select the task',
  ['Subject']
);
export const eventIdDropdown = createRecordIdDropdown(
  'Events',
  'Event',
  'Select the event',
  ['Event_Name']
);
export const callIdDropdown = createRecordIdDropdown(
  'Calls',
  'Call',
  'Select the call',
  ['Call_Name']
);

export const productidDropdown = createRecordIdDropdown(
  'Products',
  'Product',
  'Select the product',
  ['Product_Name']
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

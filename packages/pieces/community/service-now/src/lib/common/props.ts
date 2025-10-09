import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { ServiceNowClient } from './client';

export const serviceNowAuth = {
  instanceUrl: Property.ShortText({
    displayName: 'ServiceNow Instance URL',
    description: 'Full base URL of your ServiceNow instance (e.g., https://instance.service-now.com)',
    required: true,
  }),
  authType: Property.StaticDropdown({
    displayName: 'Authentication Type',
    required: true,
    defaultValue: 'basic',
    options: {
      disabled: false,
      options: [
        { label: 'Basic Auth', value: 'basic' },
        { label: 'Bearer Token', value: 'bearer' },
      ],
    },
  }),
  username: Property.ShortText({
    displayName: 'Username',
    required: false,
  }),
  password: Property.ShortText({
    displayName: 'Password',
    required: false,
  }),
  token: Property.ShortText({
    displayName: 'Bearer Token',
    required: false,
  }),
};

export const tableDropdown = Property.Dropdown({
  displayName: 'Table',
  description: 'ServiceNow table to work with',
  required: true,
  refreshers: ['instanceUrl', 'authType', 'username', 'password', 'token'],
  options: async ({ instanceUrl, authType, username, password, token }) => {
    if (!instanceUrl || !authType) {
      return {
        disabled: true,
        placeholder: 'Please configure authentication first',
        options: [],
      };
    }

    try {
      const auth = authType === 'basic' 
        ? { type: 'basic' as const, username: username as string, password: password as string }
        : { type: 'bearer' as const, token: token as string };

      const client = new ServiceNowClient({
        instanceUrl: instanceUrl as string,
        auth,
      });

      const tables = await client.getTables();
      return {
        disabled: false,
        options: tables,
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Failed to load tables. Check your credentials.',
        options: [],
      };
    }
  },
});

export const recordDropdown = Property.Dropdown({
  displayName: 'Record',
  description: 'Select a record from the table',
  required: true,
  refreshers: ['instanceUrl', 'authType', 'username', 'password', 'token', 'table'],
  options: async ({ instanceUrl, authType, username, password, token, table }) => {
    if (!instanceUrl || !authType || !table) {
      return {
        disabled: true,
        placeholder: 'Please select a table first',
        options: [],
      };
    }

    try {
      const auth = authType === 'basic' 
        ? { type: 'basic' as const, username: username as string, password: password as string }
        : { type: 'bearer' as const, token: token as string };

      const client = new ServiceNowClient({
        instanceUrl: instanceUrl as string,
        auth,
      });

      const records = await client.getRecordsForDropdown(table as string);
      return {
        disabled: false,
        options: records,
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Failed to load records. Check your credentials and table selection.',
        options: [],
      };
    }
  },
});

export function createServiceNowClient(props: DynamicPropsValue): ServiceNowClient {
  const { instanceUrl, authType, username, password, token } = props;
  
  const auth = authType === 'basic' 
    ? { type: 'basic' as const, username: username as string, password: password as string }
    : { type: 'bearer' as const, token: token as string };

  return new ServiceNowClient({
    instanceUrl: instanceUrl as string,
    auth,
  });
}
import { Property, DynamicPropsValue, PieceAuth, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { ServiceNowClient } from './client';

export const servicenowAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your ServiceNow instance URL without trailing slash (e.g., https://dev12345.service-now.com)',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your ServiceNow username (not email)',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Your ServiceNow password (not API token)',
      required: true,
    }),
  },
});

export const tableDropdown = Property.Dropdown({
  auth: servicenowAuth,
  displayName: 'Table',
  description: 'ServiceNow table to work with',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your ServiceNow account first',
        options: [],
      };
    }

    try {
      const client = new ServiceNowClient({
        instanceUrl: (auth as any).instanceUrl,
        auth: {
          type: 'basic',
          username: (auth as any).username,
          password: (auth as any).password,
        },
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
  auth: servicenowAuth,
  displayName: 'Record',
  description: 'Select a record from the table',
  required: true,
  refreshers: ['table'],
  options: async ({ auth, table }) => {
    if (!auth || !table) {
      return {
        disabled: true,
        placeholder: 'Please select a table first',
        options: [],
      };
    }

    try {
      const client = new ServiceNowClient({
        instanceUrl: (auth as any).instanceUrl,
        auth: {
          type: 'basic',
          username: (auth as any).username,
          password: (auth as any).password,
        },
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

export function createServiceNowClient(auth: AppConnectionValueForAuthProperty<typeof servicenowAuth>): ServiceNowClient {
  return new ServiceNowClient({
    instanceUrl: auth.props.instanceUrl,
    auth: {
      type: 'basic',
      username: auth.props.username,
      password: auth.props.password,
    },
  });
}
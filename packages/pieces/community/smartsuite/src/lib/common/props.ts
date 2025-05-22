import { Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from './client';

export const appIdDropdown = Property.Dropdown({
  displayName: 'App',
  description: 'The SmartSuite app to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please enter your API key and Workspace ID first',
        options: [],
      };
    }

    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    try {
      const apps = await client.listApps();

      if (!Array.isArray(apps)) {
        console.error('Expected array response from SmartSuite API, got:', typeof apps);
        return {
          disabled: true,
          placeholder: 'Invalid response from SmartSuite API',
          options: [],
        };
      }

      return {
        options: apps.map((app: any) => ({
          label: app.name,
          value: app.id,
        })),
      };
    } catch (error) {
      console.error('Error fetching SmartSuite apps:', error);
      return {
        disabled: true,
        placeholder: 'Error fetching apps. Check your credentials.',
        options: [],
      };
    }
  },
});

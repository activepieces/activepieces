import { Property } from '@activepieces/pieces-framework';
import {
  ApitemplateAuthConfig,
  makeRequest,
} from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const regionDropdown = Property.StaticDropdown({
  displayName: 'Region',
  description: 'Select your preferred API region for better performance',
  required: true,
  defaultValue: 'default',
  options: {
    options: [
      {
        label: 'Default (Singapore)',
        value: 'default',
      },
      {
        label: 'Europe (Frankfurt)',
        value: 'europe',
      },
      {
        label: 'US East (N. Virginia)',
        value: 'us',
      },
      {
        label: 'Australia (Sydney)',
        value: 'australia',
      },
      {
        label: 'Alternative - Default (Singapore)',
        value: 'alt-default',
      },
      {
        label: 'Alternative - Europe (Frankfurt)',
        value: 'alt-europe',
      },
      {
        label: 'Alternative - US East (N. Virginia)',
        value: 'alt-us',
      },
    ],
  },
});

export const templateIdDropdown = Property.Dropdown({
  displayName: 'Template ID',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    // Type-safe auth casting
    const authConfig = auth as ApitemplateAuthConfig;

    if (!authConfig.apiKey || !authConfig.region) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please complete authentication setup.',
      };
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/list-templates',
        undefined,
        undefined,
        authConfig.region
      );

      // Handle the specific APITemplate.io response structure
      const templates = response?.templates || [];

      if (!Array.isArray(templates) || templates.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No templates found',
        };
      }

      return {
        disabled: false,
        options: templates.map((template: any) => ({
          label: `${template.name} (${template.format}) - ${template.status}`,
          value: template.template_id,
        })),
      };
    } catch (error) {
      console.error('Error loading templates:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading templates',
      };
    }
  },
});

export const transactionRefDropdown = Property.Dropdown({
  displayName: 'Transaction Reference',
  description: 'Select a transaction reference to filter objects.',
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

    // Type-safe auth casting
    const authConfig = auth as ApitemplateAuthConfig;

    if (!authConfig.apiKey || !authConfig.region) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please complete authentication setup',
      };
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/list-objects',
        undefined,
        undefined,
        authConfig.region
      );

      // Handle the specific APITemplate.io response structure
      const objects = response?.objects || [];

      if (!Array.isArray(objects) || objects.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No objects found',
        };
      }

      return {
        disabled: false,
        options: objects.map((obj: any) => ({
          label: obj.transaction_ref || 'Unknown Transaction Ref',
          value: obj.transaction_ref || '',
        })),
      };
    } catch (error) {
      console.error('Error loading transaction references:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading transaction references',
      };
    }
  },
});

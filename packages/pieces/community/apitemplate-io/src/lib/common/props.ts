import { Property } from '@activepieces/pieces-framework';
import { ApitemplateRegion, makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const regionDropdown = Property.StaticDropdown({
  displayName: 'Region',
  description: 'Select your preferred API region for better performance',
  required: true,
  defaultValue: 'default',
  options: {
    options: [
      {
        label: 'Default (Singapore) - 100s timeout, 1MB max',
        value: 'default',
      },
      {
        label: 'Europe (Frankfurt) - 100s timeout, 1MB max',
        value: 'europe',
      },
      {
        label: 'US East (N. Virginia) - 100s timeout, 1MB max',
        value: 'us',
      },
      {
        label: 'Australia (Sydney) - 30s timeout, 6MB max',
        value: 'australia',
      },
      {
        label: 'Alternative - Default (Singapore) - 30s timeout, 6MB max',
        value: 'alt-default',
      },
      {
        label: 'Alternative - Europe (Frankfurt) - 30s timeout, 6MB max',
        value: 'alt-europe',
      },
      {
        label: 'Alternative - US East (N. Virginia) - 30s timeout, 6MB max',
        value: 'alt-us',
      },
    ],
  },
});

export const templateIdDropdown = Property.Dropdown({
  displayName: 'Template ID',
  description: 'Select a template ID to use for image generation',
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

    try {
      const response = await makeRequest(
        auth.apiKey as string,
        HttpMethod.GET,
        '/list-templates',
        undefined,
        undefined,
        auth.region as ApitemplateRegion
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
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading templates',
      };
    }
  },
});

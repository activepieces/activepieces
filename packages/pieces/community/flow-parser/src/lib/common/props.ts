import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { flowParserAuth } from './auth';

const BASE_URL = 'https://api.flowparser.one/v1';

export const templateDropdown = Property.Dropdown({
  displayName: 'Template',
  description: 'Select a template to monitor for new parsed documents',
  required: true,
  auth: flowParserAuth,
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
      const response = await httpClient.sendRequest<{
        templates: Array<{
          id: string;
          name: string;
        }>;
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/documents/templates`,
        headers: {
          flow_api_key: auth.secret_text,
        },
      });

      if (!response.body.templates || response.body.templates.length === 0) {
        return {
          options: [],
          placeholder: 'No templates found',
        };
      }

      return {
        disabled: false,
        options: response.body.templates.map((template) => ({
          label: template.name,
          value: template.id,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: 'Failed to load templates. Please check your API key.',
        options: [],
      };
    }
  },
});


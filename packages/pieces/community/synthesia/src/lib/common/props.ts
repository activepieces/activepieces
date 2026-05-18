import { Property } from '@activepieces/pieces-framework';
import { synthesiaAuth } from './auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const templateIdDropdown = Property.Dropdown({
  auth: synthesiaAuth,
  displayName: 'Template',
  description: 'Select the template to use for video creation',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your account',
      };
    }
    try {
      const apiKey = auth?.secret_text;
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.synthesia.io/v2/templates',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return {
        disabled: false,
        options: response.body.templates.map((template: any) => ({
          label: template.title,
          value: template.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Unable to fetch templates',
      };
    }
  },
});

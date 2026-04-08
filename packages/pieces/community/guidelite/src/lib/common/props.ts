import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { guideliteAuth } from './auth';

export const assistantIdDropdown = Property.Dropdown({
  displayName: 'Assistant',
  description: 'Please select assistant',
  refreshers: [],
  auth: guideliteAuth,
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Guidelite account first.',
        options: [],
      };
    }
    try {
      const response = await makeRequest(
        auth,
        HttpMethod.GET,
        '/assistant/list'
      );

      return {
        disabled: false,
        options: response.map((model: any) => {
          return {
            label: model.assistantName,
            value: model.assistantId,
          };
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load assistants, API key is invalid",
      };
    }
  },
});

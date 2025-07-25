import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { grokApiCall, GrokAuthProps } from './client';

interface GrokModel {
  id: string;
  name: string;
}

interface GrokModelsResponse {
  data: GrokModel[];
}

export const modelIdDropdown = Property.Dropdown({
  displayName: 'Model',
  description: 'Select the model to use for the task',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Grok account first',
      };
    }

    try {
      const response = await grokApiCall<GrokModelsResponse>({
        auth: auth as GrokAuthProps,
        method: HttpMethod.GET,
        resourceUri: '/models',
      });

      const models = response.data || [];

      return {
        disabled: false,
        options: models.map((model) => ({
          label: model.name || model.id,
          value: model.id,
        })),
        placeholder:
          models.length === 0 ? 'No models available' : 'Select a model',
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error loading models: ${error.message}`,
      };
    }
  },
});

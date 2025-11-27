import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { imageRouterApiCall } from './client';

export const modelDropdown = Property.Dropdown({
  displayName: 'Model',
  description: 'Select an image generation model',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first',
        options: [],
      };
    }

    try {
      const response = await imageRouterApiCall<any>({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/v1/models?type=image',
      });

      // Handle different response structures
      let models: Array<{ id: string; name?: string; provider?: string }> = [];
      
      if (Array.isArray(response)) {
        models = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          models = response.data;
        } else if (Array.isArray(response.models)) {
          models = response.models;
        } else if (Array.isArray(response.items)) {
          models = response.items;
        }
      }
      
      if (models.length === 0) {
        return {
          disabled: true,
          placeholder: 'No models found',
          options: [],
        };
      }

      return {
        disabled: false,
        options: models.map((model) => {
          const modelId = model.id || (model as any).model_id || '';
          const modelName = model.name || (model as any).model_name || '';
          const provider = model.provider || (model as any).provider_name || '';
          
          const label = modelName 
            ? `${modelName}${provider ? ` (${provider})` : ''}`
            : modelId;
          
          return {
            label,
            value: modelId,
          };
        }),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Failed to load models',
        options: [],
      };
    }
  },
});


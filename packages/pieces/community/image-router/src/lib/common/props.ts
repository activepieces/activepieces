import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { imageRouterApiCall } from './client';
import { imageRouterAuth } from './auth';

export const modelDropdown = Property.Dropdown({
  auth: imageRouterAuth,
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
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        resourceUri: '/v1/models?type=image',
      });

      let models: Array<{ 
        id: string; 
        name: string; 
        provider: string;
        category: string;
        isFree: boolean;
        isFast: boolean;
        isPremium: boolean;
      }> = [];
      
      if (response && typeof response === 'object') {
        const keys = Object.keys(response);
        if (keys.length > 0 && typeof response[keys[0]] === 'object') {
          models = keys.map((modelId) => {
            const modelData = response[modelId];
            const provider = modelData.providers?.[0]?.id || 
                          modelData.providers?.[0]?.name || 
                          '';
            const modelName = modelId.split('/').pop() || modelId;
            
            const isFree = modelId.includes(':free') || 
              modelData.providers?.some((p: any) => 
                p.pricing?.value === 0 || 
                (p.pricing?.type === 'fixed' && p.pricing?.value === 0)
              ) || false;
            
            const nameLower = modelName.toLowerCase();
            const isFast = nameLower.includes('fast') || 
              nameLower.includes('turbo') || 
              nameLower.includes('schnell') || 
              nameLower.includes('flash') || 
              nameLower.includes('lightning') ||
              nameLower.includes('mini');
            
            const isPremium = nameLower.includes('pro') || 
              nameLower.includes('ultra') || 
              nameLower.includes('max') ||
              nameLower.includes('quality');
            
            let category = '';
            if (isFree) {
              category = 'Free';
            } else if (isFast) {
              category = 'Fast';
            } else if (isPremium) {
              category = 'Premium';
            } else {
              category = 'Standard';
            }
            
            return {
              id: modelId,
              name: modelName,
              provider,
              category,
              isFree,
              isFast,
              isPremium,
            };
          });
        } else if (Array.isArray(response)) {
          models = response;
        } else if (Array.isArray(response.data)) {
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

      const sortedModels = models.sort((a, b) => {
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        if (a.isFast && !b.isFast) return -1;
        if (!a.isFast && b.isFast) return 1;
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        disabled: false,
        options: sortedModels.map((model) => {
          const modelId = model.id || '';
          const modelName = model.name || modelId.split('/').pop() || modelId;
          const provider = model.provider || '';
          const category = model.category || '';
          
          // Create label with clear category prefix using brackets
          const label = provider 
            ? `[${category}] ${modelName} (${provider})`
            : `[${category}] ${modelName}`;
          
          return {
            label,
            value: modelId,
          };
        }),
      };
    } catch (error: any) {
      console.error('Error fetching models:', error);
      return {
        disabled: true,
        placeholder: `Failed to load models: ${error.message || 'Unknown error'}`,
        options: [],
      };
    }
  },
});


import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  IMAGE_GENERATION_STATIC_PROVIDERS,
  IMAGE_GENERATION_STATIC_MODELS,
  IMAGE_GENERATION_STATIC_RESOLUTIONS,
  normalizeImageGeneration,
} from '../common/providers';

export const imageGenerationAction = createAction({
  name: 'image_generation',
  displayName: 'Image Generation',
  description: 'Create images from text prompts using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(IMAGE_GENERATION_STATIC_PROVIDERS),
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The prompt to generate the image from.',
      required: true,
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Model to use for image generation.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(IMAGE_GENERATION_STATIC_MODELS),
    }),
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description: 'Image resolution.',
      required: false,
      refreshers: ['provider', 'model'],
      options: createStaticDropdown(IMAGE_GENERATION_STATIC_RESOLUTIONS),
    }),
    num_images: Property.Number({
      displayName: 'Number of Images',
      description: 'Number of images to generate (optional).',
      required: false,
      defaultValue: 1,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, prompt, model, resolution, num_images, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt is required and must be a non-empty string.');
    }
    if (num_images !== undefined && (typeof num_images !== 'number' || num_images < 1 || num_images > 10)) {
      throw new Error('Number of images must be a number between 1 and 10.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      text: prompt,
      fallback_providers: fallback_providers || [],
    };
    if (model) body['model'] = model;
    if (resolution) body['resolution'] = resolution;
    if (num_images) body['num_images'] = num_images;
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/image/generation',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeImageGeneration(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to generate image: ${err.message || err}`);
    }
  },
}); 
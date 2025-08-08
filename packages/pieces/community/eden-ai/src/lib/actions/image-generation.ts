import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const IMAGE_GENERATION_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'StabilityAI', value: 'stabilityai' },
  { label: 'Replicate', value: 'replicate' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'Leonardo', value: 'leonardo' },
  { label: 'MiniMax', value: 'minimax' },
  { label: 'ByteDance', value: 'bytedance' },
];

const IMAGE_GENERATION_MODELS = [
  { label: 'DALL-E 3 (OpenAI)', value: 'dall-e-3' },
  { label: 'DALL-E 2 (OpenAI)', value: 'dall-e-2' },
  
  { label: 'Stable Diffusion v1.6 (StabilityAI)', value: 'stable-diffusion-v1-6' },
  { label: 'Stable Diffusion XL 1024 v1.0 (StabilityAI)', value: 'stable-diffusion-xl-1024-v1-0' },
  
  { label: 'Classic (Replicate)', value: 'classic' },
  { label: 'Anime Style (Replicate)', value: 'anime-style' },
  { label: 'Vintedois Diffusion (Replicate)', value: 'vintedois-diffusion' },
  
  { label: 'Titan Image Generator v1 Premium (Amazon)', value: 'titan-image-generator-v1_premium' },
  { label: 'Titan Image Generator v1 Standard (Amazon)', value: 'titan-image-generator-v1_standard' },
  
  { label: 'Leonardo Phoenix', value: 'Leonardo Phoenix' },
  { label: 'Leonardo Lightning XL', value: 'Leonardo Lightning XL' },
  { label: 'Leonardo Anime XL', value: 'Leonardo Anime XL' },
  { label: 'Leonardo Kino XL', value: 'Leonardo Kino XL' },
  { label: 'Leonardo Vision XL', value: 'Leonardo Vision XL' },
  { label: 'Leonardo Diffusion XL', value: 'Leonardo Diffusion XL' },
  { label: 'AlbedoBase XL', value: 'AlbedoBase XL' },
  { label: 'SDXL 0.9', value: 'SDXL 0.9' },
  
  { label: 'Image-01 (MiniMax)', value: 'image-01' },
  
  { label: 'SeeDream 3.0 T2I (ByteDance)', value: 'seedream-3-0-t2i-250415' },
];

const IMAGE_GENERATION_RESOLUTIONS = [
  { label: '256x256', value: '256x256' },
  { label: '512x512', value: '512x512' },
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x1792 (Portrait)', value: '1024x1792' },
  { label: '1792x1024 (Landscape)', value: '1792x1024' },
];

function normalizeImageGenerationResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, items: [], status: 'fail', raw: response };
  }

  return {
    provider,
    items: providerResult.items || [],
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const imageGenerationAction = createAction({
  name: 'image_generation',
  displayName: 'Image Generation',
  description: 'Create images from text prompts using Eden AI. Supports multiple providers, models, and resolutions.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for image generation.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(IMAGE_GENERATION_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Prompt',
      description: 'Description of the desired image(s). Be specific and descriptive for best results.',
      required: true,
    }),
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description: 'The image resolution (e.g., 512x512, 1024x1024).',
      required: true,
      refreshers: [],
      options: createStaticDropdown(IMAGE_GENERATION_RESOLUTIONS),
      defaultValue: '1024x1024',
    }),
    num_images: Property.Number({
      displayName: 'Number of Images',
      description: 'Number of images to generate (1-10).',
      required: false,
      defaultValue: 1,
    }),
    model: Property.Dropdown({
      displayName: 'Specific Model',
      description: 'Specific model to use for image generation. Leave empty for provider default.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(IMAGE_GENERATION_MODELS),
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(IMAGE_GENERATION_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: 'Include the raw provider response in the output for debugging.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().min(1, 'Provider is required'),
      text: z.string().min(1, 'Prompt text is required'),
      resolution: z.string().min(1, 'Resolution is required'),
      num_images: z.number().int().min(1).max(10).nullish(),
      model: z.string().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      resolution, 
      num_images, 
      model, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
      resolution,
    };

    if (num_images && num_images !== 1) body['num_images'] = num_images;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    if (model) {
      body['settings'] = { [provider]: model };
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/image/generation/',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeImageGenerationResponse(provider, response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your prompt and parameters.');
      }
      if (err.message && typeof err.message === 'string') {
        throw new Error(`Failed to generate image: ${err.message}`);
      }
      throw new Error(`Failed to generate image: ${JSON.stringify(err)}`);
    }
  },
}); 
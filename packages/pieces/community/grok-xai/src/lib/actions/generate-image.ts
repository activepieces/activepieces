import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  propsValidation,
} from '@activepieces/pieces-common';
import { grokAuth } from '../common/auth';
import { XAI_BASE_URL } from '../common/constants';
import { 
  createModelProperty
} from '../common/utils';
import { z } from 'zod';

export const generateImage = createAction({
  auth: grokAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Create images from text prompts using Grok\'s image generation.',
  props: {
    prompt: Property.LongText({
      displayName: 'Image Prompt',
      required: true,
      description: 'Detailed description of the image you want to generate.',
    }),
    model: createModelProperty({
      displayName: 'Image Model',
      description: 'Image generation model to use.',
      defaultValue: 'grok-2-image-1212',
      filterForImages: true
    }),
    numberOfImages: Property.Number({
      displayName: 'Number of Images',
      required: false,
      defaultValue: 1,
      description: 'Number of images to generate (1-10).',
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      required: false,
      defaultValue: 'url',
      description: 'Format of the generated images.',
      options: {
        disabled: false,
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Base64 JSON', value: 'b64_json' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      numberOfImages: z.number().min(1).max(10).optional(),
      prompt: z.string().min(1).max(4000),
    });

    const {
      prompt,
      model,
      numberOfImages,
      responseFormat,
    } = propsValue;

    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    const requestBody: any = {
      prompt: prompt.trim(),
      model,
      n: numberOfImages || 1,
    };

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${XAI_BASE_URL}/images/generations`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        body: requestBody,
        timeout: 120000,
      });

      if (!response.body.data || !Array.isArray(response.body.data)) {
        throw new Error('Invalid response format from image generation API');
      }

      const images = response.body.data;

      if (images.length === 0) {
        throw new Error('No images were generated');
      }

      const result = {
        images: images.map((img: any, index: number) => {
          if (!img.url && !img.b64_json) {
            throw new Error(`Image ${index + 1} is missing both URL and base64 data`);
          }

          return {
            index: index + 1,
            url: img.url || null,
            b64_json: img.b64_json || null,
            revised_prompt: img.revised_prompt || prompt,
          };
        }),
        prompt_used: prompt,
        model_used: model,
        total_images: images.length,
        response_format: responseFormat || 'url',
      };

      return result;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response?.body?.error?.message || 'Bad request';
        throw new Error(`Image generation failed: ${errorMessage}`);
      }
      
      if (error.response?.status === 422) {
        const errorMessage = error.response?.body?.error?.message || 'Validation error';
        throw new Error(`Invalid parameters: ${errorMessage}`);
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Image generation service temporarily unavailable. Please try again.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your xAI API key.');
      }

      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      }

      if (error.message?.includes('timeout')) {
        throw new Error('Image generation timed out. The request may have been too complex. Try simplifying your prompt.');
      }

      throw new Error(`Image generation failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
}); 
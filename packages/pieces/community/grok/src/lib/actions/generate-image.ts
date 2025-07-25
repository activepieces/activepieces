import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { grokApiCall } from '../common/client';
import { grokAuth } from '../common/auth';
import { modelIdDropdown } from '../common/props';

export const generateImageAction = createAction({
  auth: grokAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description:
    'Create brand-new images from text prompts (e.g., illustrations, visuals).',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A detailed description of the image you want to generate.',
      required: true,
    }),
    model: modelIdDropdown,
    n: Property.Number({
      displayName: 'Number of Images',
      description: 'The number of images to generate (from 1 to 10).',
      required: false,
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description:
        'The format in which the generated images are returned. "url" is faster, while "b64_json" is useful for direct file handling.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Base64 JSON', value: 'b64_json' },
        ],
      },
      defaultValue: 'url',
    }),
  },
  async run({ propsValue, auth }) {
    const { prompt, model, n, response_format } = propsValue;

    const requestBody: Record<string, unknown> = {
      prompt,
      model,
    };

    if (n) {
      if (n < 1 || n > 10) {
        throw new Error('Number of images must be between 1 and 10.');
      }
      requestBody['n'] = n;
    }

    if (response_format) {
      requestBody['response_format'] = response_format;
    }

    try {
      const response = await grokApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: '/images/generations',
        body: requestBody,
      });

      return response;
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your prompt, number of images, and response format.'
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and account access.'
        );
      }

      if (error.message.includes('404')) {
        throw new Error(
          'Model or endpoint not found. Please verify the model exists and you have access to it.'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  },
});

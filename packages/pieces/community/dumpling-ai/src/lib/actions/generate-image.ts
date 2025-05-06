import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const generateImage = createAction({
  name: 'generate_image',
  auth: dumplingAuth,
  displayName: 'Generate Image',
  description: 'Create images from text prompts using AI',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'Text description of the image you want to generate',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'AI model to use for image generation',
      defaultValue: 'dall-e-3',
      options: {
        options: [
          { label: 'DALL-E 3', value: 'dall-e-3' },
          { label: 'DALL-E 2', value: 'dall-e-2' },
          { label: 'Stable Diffusion', value: 'stable-diffusion' }
        ]
      }
    }),
    size: Property.StaticDropdown({
      displayName: 'Image Size',
      required: false,
      description: 'Dimensions for the generated image',
      defaultValue: '1024x1024',
      options: {
        options: [
          { label: 'Square (1024x1024)', value: '1024x1024' },
          { label: 'Portrait (1024x1792)', value: '1024x1792' },
          { label: 'Landscape (1792x1024)', value: '1792x1024' },
          { label: 'Small (512x512)', value: '512x512' }
        ]
      }
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      required: false,
      description: 'Quality of the generated image (DALL-E 3 only)',
      defaultValue: 'standard',
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'HD', value: 'hd' }
        ]
      }
    }),
    style: Property.StaticDropdown({
      displayName: 'Style',
      required: false,
      description: 'Visual style for the generated image (DALL-E 3 only)',
      defaultValue: 'vivid',
      options: {
        options: [
          { label: 'Vivid', value: 'vivid' },
          { label: 'Natural', value: 'natural' }
        ]
      }
    }),
  },
  async run({ auth, propsValue }) {
    const { prompt, model, size, quality, style } = propsValue;

    const requestBody: Record<string, any> = {
      prompt
    };

    // Add optional parameters if provided
    if (model) requestBody['model'] = model;
    if (size) requestBody['size'] = size;
    if (quality) requestBody['quality'] = quality;
    if (style) requestBody['style'] = style;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DUMPLING_API_URL}/generate-image`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 
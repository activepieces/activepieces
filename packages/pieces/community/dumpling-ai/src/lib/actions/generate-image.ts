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
      defaultValue: 'FLUX.1-schnell',
      options: {
        options: [
          { label: 'FLUX.1-schnell (3 credits/image)', value: 'FLUX.1-schnell' },
          { label: 'FLUX.1-dev (25 credits/image)', value: 'FLUX.1-dev' },
          { label: 'FLUX.1-pro (50 credits/image)', value: 'FLUX.1-pro' },
          { label: 'DALL-E 3', value: 'dall-e-3' },
          { label: 'DALL-E 2', value: 'dall-e-2' },
          { label: 'Stable Diffusion', value: 'stable-diffusion' }
        ]
      }
    }),
    image_size: Property.StaticDropdown({
      displayName: 'Image Size',
      required: false,
      description: 'Size and aspect ratio of the generated image',
      defaultValue: 'square',
      options: {
        options: [
          { label: 'Square HD', value: 'square_hd' },
          { label: 'Square', value: 'square' },
          { label: 'Portrait 4:3', value: 'portrait_4_3' },
          { label: 'Portrait 16:9', value: 'portrait_16_9' },
          { label: 'Landscape 4:3', value: 'landscape_4_3' },
          { label: 'Landscape 16:9', value: 'landscape_16_9' },
          { label: 'Square (1024x1024)', value: '1024x1024' },
          { label: 'Portrait (1024x1792)', value: '1024x1792' },
          { label: 'Landscape (1792x1024)', value: '1792x1024' },
          { label: 'Small (512x512)', value: '512x512' }
        ]
      }
    }),
    num_inference_steps: Property.Number({
      displayName: 'Number of Inference Steps',
      required: false,
      description: 'Number of inference steps (higher values = more detailed images but slower generation)',
    }),
    seed: Property.Number({
      displayName: 'Seed',
      required: false,
      description: 'Seed for reproducible results',
    }),
    num_images: Property.Number({
      displayName: 'Number of Images',
      required: false,
      defaultValue: 1,
      description: 'Number of images to generate',
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
    const { 
      prompt, 
      model, 
      image_size, 
      num_inference_steps, 
      seed, 
      num_images,
      quality, 
      style 
    } = propsValue;

    const requestBody: Record<string, any> = {
      prompt
    };

    // Add optional parameters if provided
    if (model) requestBody['model'] = model;
    
    // Handle different naming conventions depending on the model
    if (model && (model.startsWith('FLUX') || model === 'stable-diffusion')) {
      if (image_size) requestBody['image_size'] = image_size;
      if (num_inference_steps) requestBody['num_inference_steps'] = num_inference_steps;
      if (seed !== undefined) requestBody['seed'] = seed;
      if (num_images) requestBody['num_images'] = num_images;
    } else {
      // For DALL-E models
      if (image_size) requestBody['size'] = image_size;
      if (quality) requestBody['quality'] = quality;
      if (style) requestBody['style'] = style;
    }

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
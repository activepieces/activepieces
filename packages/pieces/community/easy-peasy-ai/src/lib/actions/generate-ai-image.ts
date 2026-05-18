import { createAction, Property } from '@activepieces/pieces-framework';
import { easyPeasyAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateAiImage = createAction({
  auth: easyPeasyAiAuth,
  name: 'generateAiImage',
  displayName: 'Generate AI Image',
  description:
    'Generate AI images based on text prompts using various models and styles',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Description of the image you want to generate',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for image generation',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'DALL-E 3', value: 'DALL-E 3' },
          { label: 'DALL-E 2', value: 'DALL-E 2' },
          { label: 'Midjourney', value: 'Midjourney' },
          { label: 'Stable Diffusion', value: 'Stable Diffusion' },
        ],
      },
    }),
    style: Property.ShortText({
      displayName: 'Style',
      description:
        'Art style or aesthetic for the generated image (e.g., "oil painting", "watercolor", "cyberpunk")',
      required: false,
    }),
    artist: Property.ShortText({
      displayName: 'Artist Inspiration',
      description:
        'Art style inspired by a specific artist (e.g., "Van Gogh", "Picasso")',
      required: false,
    }),
    dimensions: Property.StaticDropdown({
      displayName: 'Dimensions',
      description: 'Image dimensions/aspect ratio',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '1024x1024', value: '1024x1024' },
          { label: '1024x1792', value: '1024x1792' },
          { label: '1792x1024', value: '1792x1024' },
          { label: '512x512', value: '512x512' },
          { label: '256x256', value: '256x256' },
        ],
      },
      defaultValue: '1024x1024',
    }),
    useHD: Property.Checkbox({
      displayName: 'Use HD Quality',
      description: 'Generate image in HD quality (may incur higher costs)',
      required: false,
      defaultValue: true,
    }),
    image: Property.ShortText({
      displayName: 'Image Reference URL',
      description: 'Optional URL to a reference image for style consistency',
      required: false,
    }),
  },
  async run(context) {
    const { prompt, model, style, artist, dimensions, useHD, image } =
      context.propsValue;

    const payload: any = {
      prompt,
      model,
      useHD: useHD || true,
    };

    // Add optional fields if provided
    if (style) {
      payload.style = style;
    }
    if (artist) {
      payload.artist = artist;
    }
    if (dimensions) {
      payload.dimensions = dimensions;
    }
    if (image) {
      payload.image = image;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/api/generate-image',
      payload
    );

    return response;
  },
});

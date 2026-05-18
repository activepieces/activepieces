import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kebabCase } from '@activepieces/shared';
import { randomBytes } from 'node:crypto';
import OpenAI from 'openai';
import { openaiAuth } from '../auth';

export const generateImage = createAction({
  auth: openaiAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Generate an image using OpenAI.',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the OpenAI API. Default is https://api.openai.com/v1',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A text description of the desired image(s).',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for image generation.',
      required: false,
      defaultValue: 'dall-e-3',
      options: {
        options: [
          { label: 'DALL·E 3', value: 'dall-e-3' },
          { label: 'DALL·E 2', value: 'dall-e-2' },
        ],
      },
    }),
    n: Property.Number({
      displayName: 'Number of Images',
      description: 'The number of images to generate. Must be between 1 and 10.',
      required: false,
      defaultValue: 1,
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      description: 'The size of the generated images.',
      required: false,
      defaultValue: '1024x1024',
      options: {
        options: [
          { label: '256x256', value: '256x256' },
          { label: '512x512', value: '512x512' },
          { label: '1024x1024', value: '1024x1024' },
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      description: 'The quality of the generated image (only for DALL·E 3).',
      required: false,
      defaultValue: 'standard',
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'HD', value: 'hd' },
        ],
      },
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'The format in which the generated images are returned.',
      required: false,
      defaultValue: 'b64_json',
      options: {
        options: [
          { label: 'URL', value: 'url' },
          { label: 'Base64 JSON', value: 'b64_json' },
        ],
      },
    }),
  },
  async run(context) {
    const openai = new OpenAI({
      apiKey: context.auth as string,
      baseURL: context.propsValue.baseUrl || undefined,
    });
    const { quality, resolution, model, prompt, n, response_format } = context.propsValue;

    const response = await openai.images.generate({
      prompt,
      model: model as any,
      n: n ?? undefined,
      size: resolution as any,
      quality: quality as any,
      response_format: response_format as any,
    });

    const savedImages = await Promise.all(
      response.data.map(async (img: any, index) => {
        if (response_format === 'url') {
          return { url: img.url, revised_prompt: img.revised_prompt };
        }
        const imageBuffer = Buffer.from(img.b64_json, 'base64');
        const fileName = `${kebabCase(prompt)}-${index}.png`;
        const fileUrl = await context.files.write({ fileName, data: imageBuffer });
        return { url: fileUrl, fileName, revised_prompt: img.revised_prompt };
      })
    );

    return { ...response, images: savedImages };
  },
});

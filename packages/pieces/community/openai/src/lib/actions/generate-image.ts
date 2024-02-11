import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { openaiAuth } from '../..';

export const generateImage = createAction({
  auth: openaiAuth,
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Generate an image using text-to-image models',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model which will generate the image.',
      defaultValue: 'dall-e-3',
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'dall-e-3',
              value: 'dall-e-3',
            },
            {
              label: 'dall-e-2',
              value: 'dall-e-2',
            },
          ],
        };
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: false,
      refreshers: ['model'],
      defaultValue: '1024x1024',
      options: async ({ model }) => {
        let options = [
          {
            label: '1024x1024',
            value: '1024x1024',
          },
          {
            label: '512x512',
            value: '512x512',
          },
          {
            label: '256x256',
            value: '256x256',
          },
        ];
        if (model == 'dall-e-3')
          options = [
            {
              label: '1024x1024',
              value: '1024x1024',
            },
            {
              label: '1024x1792',
              value: '1024x1792',
            },
            {
              label: '1792x1024',
              value: '1792x1024',
            },
          ];

        return {
          options: options,
        };
      },
    }),
    quality: Property.Dropdown({
      displayName: 'Quality',
      required: false,
      description: 'Standard is faster, HD has better details.',
      defaultValue: 'standard',
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'standard',
              value: 'standard',
            },
            {
              label: 'hd',
              value: 'hd',
            },
          ],
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const openai = new OpenAI({
      apiKey: auth,
    });

    const { quality, resolution, model, prompt } = propsValue;

    const image = await openai.images.generate({
      model: model,
      prompt: prompt,
      quality: quality as any,
      size: resolution as any,
    });

    return image;
  },
});

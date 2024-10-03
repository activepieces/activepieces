import { createAction, Property } from '@activepieces/pieces-framework';
import { AI, aiProps } from '@activepieces/pieces-common';

export const generateImage = createAction({
  name: 'generateImage',
  displayName: 'Generate Image',
  description: '',
  props: {
    provider: aiProps('image').provider,
    model: aiProps('image').model,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    resolution: Property.Dropdown({
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: true,
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
      required: true,
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
  async run(context) {
    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const response = await ai.image?.generate({
      model: context.propsValue.model,
      prompt: context.propsValue.prompt,
      size: context.propsValue.resolution,
      quality: context.propsValue.quality,
    });

    if (response) {
      return context.files.write({
        data: Buffer.from(response.image, 'base64'),
        fileName: 'image.png',
      });
    } else {
      throw new Error(
        'Unknown error occurred. Please check image configuration.'
      );
    }
  },
});

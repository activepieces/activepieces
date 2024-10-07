import { AI, aiProps } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

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
    advancedOptions: aiProps('image').advancedOptions,
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
  },
  async run(context) {
    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const image = ai.image

    if (!image) {
      throw new Error(
        `Model ${context.propsValue.model} does not support image generation.`
      );
    }

    const advancedOptions = context.propsValue.advancedOptions ?? {};

    const response = await image.generate({
      model: context.propsValue.model,
      prompt: context.propsValue.prompt,
      size: context.propsValue.resolution,
      advancedOptions: advancedOptions,
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

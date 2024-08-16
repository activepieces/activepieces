import { createAction, Property } from '@activepieces/pieces-framework';

export const generateImageAction = createAction({
  name: 'generate-image',
  displayName: 'Generate Image',
  description: 'Generate Image',
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'The resolution to generate the image in.',
      required: false,
      options: {
        disabled: false,
        options: [
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
        ],
      },
    }),
    quality: Property.StaticDropdown({
      displayName: 'Quality',
      required: false,
      description: 'Standard is faster, HD has better details.',
      defaultValue: 'standard',
      options: {
        disabled: false,
        options: [],
      },
    }),
  },

  async run(context) {},
});

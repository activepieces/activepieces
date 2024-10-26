import {
  ApFile,
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { AI, aiProps } from '@activepieces/pieces-common';

export const checkModeration = createAction({
  name: 'checkModeration',
  displayName: 'Check Moderation',
  description: 'Classifies if text or image is potentially harmful.',
  props: {
    provider: aiProps('moderation').provider,
    model: aiProps('moderation').model,
    inputType: Property.StaticDropdown({
      displayName: 'Input Type',
      description: 'Type of input to check moderation for.',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Body',
      required: true,
      refreshers: ['inputType'],
      props: async ({ inputType }) => {
        const type = inputType as unknown as string;
        const fields: DynamicPropsValue = {};

        if (type === 'text') {
          fields['input'] = Property.LongText({
            displayName: 'Input',
            required: true,
          });
        } else if (type === 'image') {
          fields['input'] = Property.File({
            displayName: 'Image',
            description: 'The image file to check moderation for.',
            required: true,
          });
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const ai = AI({
      provider: context.propsValue.provider,
      server: context.server,
    });

    const moderation = ai.moderation?.create;
    if (!moderation) {
      throw new Error(
        `Checking moderation is not supported by provider ${context.propsValue.provider}`
      );
    }

    const response = await moderation({
      model: context.propsValue.model,
      inputType: context.propsValue.inputType as 'text' | 'image',
      input: context.propsValue.body['input'] as string | ApFile,
    });

    return response;
  },
});

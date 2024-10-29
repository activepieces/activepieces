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
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text to check moderation for.',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Images',
      description: 'Images to check moderation for.',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'Image File',
          description: 'Image to check moderation for.',
          required: true,
        }),
      },
    }),
    // inputType: Property.StaticDropdown({
    //   displayName: 'Input Type',
    //   description: 'Type of input to check moderation for.',
    //   required: true,
    //   defaultValue: 'text',
    //   options: {
    //     disabled: false,
    //     options: [
    //       { label: 'Text', value: 'text' },
    //       { label: 'Image', value: 'image' },
    //     ],
    //   },
    // }),
    // body: Property.DynamicProperties({
    //   displayName: 'Body',
    //   required: true,
    //   refreshers: ['inputType'],
    //   props: async ({ inputType }) => {
    //     const type = inputType as unknown as string;
    //     const fields: DynamicPropsValue = {};

    //     if (type === 'text') {
    //       fields['input'] = Property.LongText({
    //         displayName: 'Input',
    //         required: true,
    //       });
    //     } else if (type === 'image') {
    //       fields['input'] = Property.File({
    //         displayName: 'Image',
    //         description: 'The image file to check moderation for.',
    //         required: true,
    //       });
    //     }

    //     return fields;
    //   },
    // }),
  },
  async run(context) {
    const text = context.propsValue.text;
    const images = (context.propsValue.images as Array<{ file: ApFile }>) ?? [];
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

    if (!text && !images.length) {
      throw new Error('Please provide text or images to check moderation');
    }

    const response = await moderation({
      model: context.propsValue.model,
      text,
      images: images.map((image) => image.file),
    });

    return response;
  },
});

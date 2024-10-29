import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { AI, aiProps } from '@activepieces/pieces-common';

export const checkModeration = createAction({
  name: 'checkModeration',
  displayName: 'Check Moderation',
  description:
    'Classifies if text or image contains hate, hate/threatening, self-harm, sexual, sexual/minors, violence, or violence/graphic content.',
  props: {
    provider: aiProps('moderation').provider,
    model: aiProps('moderation').model,
    text: Property.LongText({
      displayName: 'Text',
      required: false,
    }),
    images: Property.Array({
      displayName: 'Images',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'Image File',
          required: true,
        }),
      },
    }),
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

import { Property, Validators } from '@activepieces/pieces-framework';

export const twitterCommon = {
    text: Property.LongText({
        displayName: 'Text',
        description: 'The text of the tweet',
        required: true,
        validators: [Validators.minLength(1)],
      }),
      image_1: Property.File({
        displayName: 'Media (1)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
      image_2: Property.File({
        displayName: 'Media (2)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
      image_3: Property.File({
        displayName: 'Media (3)',
        description:
          'An image, video or GIF url or base64 to attach to the tweet',
        required: false,
      }),
    };
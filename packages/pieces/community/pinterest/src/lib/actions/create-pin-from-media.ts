import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { createPinActionOutputSchema } from '../output-schemas';

export const createPinFromMedia = createAction({
  auth: pinterestAuth,
  name: 'createPinFromMedia',
  classification: 'WRITE',
  outputSchema: createPinActionOutputSchema,
  displayName: 'Create Pin from Media',
  description: 'Publish a new Pin from a hosted image URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a new Pin to a board from a hosted image URL and returns the new pin id. Use it to put new content on Pinterest, and Save Pin to repin content that already exists. The image must be a URL Pinterest can fetch without authentication; this action cannot publish video, and raw image data is not accepted here. Requires a board id from List Boards and a title, and each call publishes another Pin, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      required: true,
      description: 'Numeric board id, as returned by List Boards.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'Title of the Pin (max 100 characters).',
    }),
    media_url: Property.ShortText({
      displayName: 'Image URL',
      required: true,
      description:
        'Publicly reachable URL of the image. Pinterest fetches it, so it must be reachable without authentication.',
    }),
    board_section_id: Property.ShortText({
      displayName: 'Board Section ID',
      required: false,
      description:
        'Optional section on that board, as returned by List Board Sections.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Description of the Pin (max 800 characters).',
    }),
    link: Property.ShortText({
      displayName: 'Destination Link',
      required: false,
      description: 'URL the Pin opens when clicked.',
    }),
    alt_text: Property.ShortText({
      displayName: 'Alt Text',
      required: false,
      description: 'Accessibility text for the media (max 500 characters).',
    }),
    dominant_color: Property.ShortText({
      displayName: 'Dominant Color',
      required: false,
      description: 'Hex color code such as #6E7874.',
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.createPin({
      accessToken: getAccessTokenOrThrow(auth),
      media_source_type: 'image_url',
      ...propsValue,
    });
  },
});

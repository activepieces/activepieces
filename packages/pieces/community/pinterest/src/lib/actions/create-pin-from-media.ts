import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createPinOperation } from '../common/operations';
import { createPinActionOutputSchema } from '../output-schemas';

export const createPinFromMedia = createAction({
  auth: pinterestAuth,
  name: 'createPinFromMedia',
  classification: 'WRITE',
  outputSchema: createPinActionOutputSchema,
  displayName: 'Create Pin from Media',
  description: 'Publish a new Pin from a hosted image or video URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a new Pin to a board from a hosted image URL, hosted video URL or base64 image, and returns the new pin id. Use it to put new content on Pinterest; use Save Pin to repin content that already exists, and Update Pin to edit a Pin already published. Requires a board id from List Boards, a title, and a reachable media URL Pinterest can fetch; each call publishes another Pin, so it is not idempotent.',
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
    media_source_type: Property.StaticDropdown({
      displayName: 'Media Source Type',
      required: true,
      description: 'How the media is supplied.',
      options: {
        options: [
          { label: 'Image URL', value: 'image_url' },
          { label: 'Base64 Image', value: 'image_base64' },
          { label: 'Video URL', value: 'video_url' },
        ],
      },
    }),
    media_url: Property.ShortText({
      displayName: 'Media URL',
      required: true,
      description: 'Publicly reachable URL of the image or video.',
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
    return await createPinOperation({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});

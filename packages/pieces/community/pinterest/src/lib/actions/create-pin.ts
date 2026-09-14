import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createPinOperation } from '../common/operations';
import {
  adAccountIdDropdown,
  boardIdDropdown,
  boardSectionIdDropdown,
  pinIdMultiSelectDropdown,
} from '../common/props';
import { createPinActionOutputSchema } from '../output-schemas';

export const createPin = createAction({
  auth: pinterestAuth,
  name: 'createPin',
  classification: 'WRITE',
  outputSchema: createPinActionOutputSchema,
  displayName: 'Create Pin',
  description: 'Upload an image or video to create a new Pin on a board.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Pin on a Pinterest board by uploading media from a hosted image/video URL (or base64 image). Use to publish visual content to a board the user owns. Requires a valid board_id and a media source; each call creates a new Pin, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    ad_account_id: adAccountIdDropdown,
    board_id: boardIdDropdown,
    board_section_id: boardSectionIdDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'The title of the Pin (max 100 characters).',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'The description of the Pin (max 800 characters).',
    }),
    media_source_type: Property.StaticDropdown({
      displayName: 'Media Source Type',
      required: true,
      description: 'The type of media source for the Pin.',
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
      description:
        'The URL of the image or video to upload. Must be a valid URL.',
    }),
    link: Property.ShortText({
      displayName: 'Destination Link',
      required: false,
      description:
        'The destination URL that the Pin will link to when clicked.',
    }),
    dominant_color: Property.ShortText({
      displayName: 'Dominant Color',
      description:
        'The dominant color of the Pin as a hex color code (e.g., "#6E7874").',
      required: false,
    }),
    alt_text: Property.ShortText({
      displayName: 'Alt Text',
      description:
        'Alternative text for accessibility and screen readers (max 500 characters).',
      required: false,
    }),
    parent_pin_id: Property.ShortText({
      displayName: 'Parent Pin ID',
      description:
        'The ID of the original Pin if this is a saved/repinned Pin.',
      required: false,
    }),
    sponsor_id: Property.ShortText({
      displayName: 'Sponsor ID',
      description:
        'The sponsor account ID for paid partnership content. Available only to select users in closed beta.',
      required: false,
    }),
    product_tags: pinIdMultiSelectDropdown,
    note: Property.ShortText({
      displayName: 'Note',
      description: 'A private note for this Pin that only you can see.',
      required: false,
    }),
    is_removable: Property.Checkbox({
      displayName: 'Is Removable',
      description:
        'Set to true to create an ad-only Pin that can be easily removed.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await createPinOperation({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});

import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  adAccountIdDropdown,
  boardIdDropdown,
  boardSectionIdDropdown,
  pinIdMultiSelectDropdown,
} from '../common/props';

export const createPin = createAction({
  auth: pinterestAuth,
  name: 'createPin',
  displayName: 'Create Pin',
  description: 'Upload an image or video to create a new Pin on a board.',
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
    const {
      board_id,
      board_section_id,
      title,
      description,
      media_source_type,
      media_url,
      link,
      dominant_color,
      alt_text,
      parent_pin_id,
      is_removable,
      product_tags,
      ad_account_id,
      note,
      sponsor_id,
    } = propsValue;

    // Validation
    if (title && title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }

    if (description && description.length > 800) {
      throw new Error('Description must be 800 characters or less');
    }

    if (alt_text && alt_text.length > 500) {
      throw new Error('Alt text must be 500 characters or less');
    }

    // URL validation for media_url
    try {
      new URL(media_url);
    } catch {
      throw new Error('Please enter a valid URL for Image/Video URL');
    }

    // URL validation for link (if provided)
    if (link) {
      try {
        new URL(link);
      } catch {
        throw new Error('Please enter a valid URL for Destination Link');
      }
    }

    // Hex color validation for dominant_color (if provided)
    if (dominant_color) {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(dominant_color)) {
        throw new Error(
          'Pin Color must be a valid hex color format (e.g., #6E7874)'
        );
      }
    }

    // Build request body according to Pinterest API spec
    const body: any = {
      board_id,
      title,
      media_source: {
        source_type: media_source_type,
        url: media_url,
      },
    };

    // Add optional fields only if they have values
    if (board_section_id) body.board_section_id = board_section_id;
    if (description) body.description = description;
    if (link) body.link = link;
    if (dominant_color) body.dominant_color = dominant_color;
    if (alt_text) body.alt_text = alt_text;
    if (parent_pin_id) body.parent_pin_id = parent_pin_id;
    if (note) body.note = note;
    if (sponsor_id) body.sponsor_id = sponsor_id;
    if (typeof is_removable === 'boolean') body.is_removable = is_removable;

    // Handle product_tags array
    if (
      product_tags &&
      Array.isArray(product_tags) &&
      product_tags.length > 0
    ) {
      body.product_tags = product_tags;
    }

    // Build API path
    let path = '/pins';
    if (ad_account_id) {
      path = `/pins?ad_account_id=${encodeURIComponent(ad_account_id)}`;
    }

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.POST,
      path,
      body
    );
  },
});

import {
  createAction,
  Property,
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
import { createPinActionOutputSchema } from '../output-schemas';

export const createPin = createAction({
  auth: pinterestAuth,
  name: 'createPin',
  classification: 'WRITE',
  outputSchema: createPinActionOutputSchema,
  displayName: 'Create Pin',
  description: 'Create a Pin on a board from an image URL or base64 image.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Pin on a Pinterest board by uploading media from a hosted image/video URL (or base64 image). Use to publish visual content to a board the user owns. Requires a valid board_id and a media source; each call creates a new Pin, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Save To',
      icon: 'inbox',
      props: ['board_id', 'board_section_id'],
    },
    {
      key: 'content',
      display: 'section',
      label: 'Pin',
      icon: 'file',
      props: [
        'title',
        'description',
        'media_source_type',
        'media_url',
        'link',
      ],
    },
  ],
  props: {
    ad_account_id: adAccountIdDropdown,
    board_id: boardIdDropdown,
    board_section_id: boardSectionIdDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'Up to 100 characters.',
      placeholder: 'e.g. 10 easy summer salads',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'Up to 800 characters.',
    }),
    media_source_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: true,
      defaultValue: 'image_url',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Image URL',
            value: 'image_url',
            description: 'JPG or PNG link',
            icon: 'file',
          },
          {
            label: 'Base64 Image',
            value: 'image_base64',
            description: 'Encoded data',
            icon: 'code',
          },
        ],
      },
    }),
    media_url: Property.ShortText({
      displayName: 'Media',
      required: true,
      description: 'Public image URL, or base64 data for the Base64 type.',
      placeholder: 'https://example.com/photo.jpg',
    }),
    link: Property.ShortText({
      displayName: 'Destination Link',
      required: false,
      description: 'Opens when someone clicks the Pin.',
      placeholder: 'https://example.com',
    }),
    dominant_color: Property.ShortText({
      displayName: 'Dominant Color',
      description: 'Hex color shown while the image loads.',
      placeholder: '#6E7874',
      required: false,
      advanced: true,
    }),
    alt_text: Property.ShortText({
      displayName: 'Alt Text',
      description:
        'Describes the image for screen readers. Up to 500 characters.',
      required: false,
      advanced: true,
    }),
    parent_pin_id: Property.ShortText({
      displayName: 'Parent Pin ID',
      description: 'ID of the Pin this one was saved from.',
      placeholder: '1234567890123456789',
      required: false,
      advanced: true,
    }),
    sponsor_id: Property.ShortText({
      displayName: 'Sponsor ID',
      description:
        'Partner account for paid partnership Pins. Closed beta only.',
      required: false,
      advanced: true,
    }),
    product_tags: pinIdMultiSelectDropdown,
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Private note only you can see.',
      required: false,
      advanced: true,
    }),
    is_removable: Property.Checkbox({
      displayName: 'Removable',
      description: 'Marks an ad-only Pin that can be removed later.',
      required: false,
      defaultValue: false,
      advanced: true,
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

    if (title && title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }

    if (description && description.length > 800) {
      throw new Error('Description must be 800 characters or less');
    }

    if (alt_text && alt_text.length > 500) {
      throw new Error('Alt text must be 500 characters or less');
    }

    if (media_source_type !== 'image_base64') {
      try {
        new URL(media_url);
      } catch {
        throw new Error('Please enter a valid URL in the Media field');
      }
    }

    if (link) {
      try {
        new URL(link);
      } catch {
        throw new Error('Please enter a valid URL for Destination Link');
      }
    }

    if (dominant_color) {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(dominant_color)) {
        throw new Error(
          'Pin Color must be a valid hex color format (e.g., #6E7874)'
        );
      }
    }

    const body: any = {
      board_id,
      title,
      media_source: buildMediaSource({
        mediaSourceType: media_source_type,
        mediaUrl: media_url,
      }),
    };

    if (board_section_id) body.board_section_id = board_section_id;
    if (description) body.description = description;
    if (link) body.link = link;
    if (dominant_color) body.dominant_color = dominant_color;
    if (alt_text) body.alt_text = alt_text;
    if (parent_pin_id) body.parent_pin_id = parent_pin_id;
    if (note) body.note = note;
    if (sponsor_id) body.sponsor_id = sponsor_id;
    if (typeof is_removable === 'boolean') body.is_removable = is_removable;

    if (
      product_tags &&
      Array.isArray(product_tags) &&
      product_tags.length > 0
    ) {
      body.product_tags = product_tags;
    }

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

function buildMediaSource({
  mediaSourceType,
  mediaUrl,
}: {
  mediaSourceType: string;
  mediaUrl: string;
}): Record<string, string> {
  if (mediaSourceType !== 'image_base64') {
    return { source_type: mediaSourceType, url: mediaUrl };
  }

  const dataUriPrefix = /^data:([^;,]+);base64,/.exec(mediaUrl);

  return {
    source_type: 'image_base64',
    content_type: dataUriPrefix ? dataUriPrefix[1] : 'image/jpeg',
    data: dataUriPrefix ? mediaUrl.slice(dataUriPrefix[0].length) : mediaUrl,
  };
}

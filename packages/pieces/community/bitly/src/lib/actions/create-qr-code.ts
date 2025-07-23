import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { shapeDropdown } from '../common/props';

export const createQrCode = createAction({
  auth: BitlyAuth,
  name: 'createQrCode',
  displayName: 'Create QR Code',
  description:
    'Generate a QR code for a Bitlink to embed in documents, marketing material, or websites.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: 'Title for the QR code. Optional.',
    }),
    group_guid: Property.ShortText({
      displayName: 'Group GUID',
      required: false,
      description: 'Bitly group GUID. Optional.',
    }),
    bitlink_id: Property.ShortText({
      displayName: 'Bitlink ID',
      required: true,
      description:
        'The Bitlink to generate a QR code for (e.g., bit.ly/abc123)',
    }),
    long_url: Property.ShortText({
      displayName: 'Long URL',
      required: true,
      description: 'The long URL to be shortened and used for the QR code.',
    }),
    site_id: Property.ShortText({
      displayName: 'Site ID',
      required: false,
      description: 'The site ID for the QR code. Optional.',
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      required: false,
      description: 'Archive this QR code?',
    }),
    background_color: Property.ShortText({
      displayName: 'Background Color',
      required: false,
      description:
        'Background color for the QR code in hex format (e.g., #FFFFFF)',
    }),
    dot_pattern_color: Property.ShortText({
      displayName: 'Dot Pattern Color',
      required: false,
      description:
        'Dot pattern color for the QR code in hex format (e.g., #000000)',
    }),
    dot_pattern_type: shapeDropdown,
    corner_1_inner_color: Property.ShortText({
      displayName: 'Corner 1 Inner Color',
      required: false,
      description:
        'Customize the inner color of the first corner of the QR code',
    }),
    corner_1_outer_color: Property.ShortText({
      displayName: 'Corner 1 Outer Color',
      required: false,
      description:
        'Customize the outer color of the first corner of the QR code',
    }),
    corner_1_shape: shapeDropdown,

    corner_2_inner_color: Property.ShortText({
      displayName: 'Corner 2 Inner Color',
      required: false,
      description:
        'Customize the inner color of the second corner of the QR code',
    }),
    corner_2_outer_color: Property.ShortText({
      displayName: 'Corner 2 Outer Color',
      required: false,
      description:
        'Customize the outer color of the second corner of the QR code',
    }),
    corner_2_shape: shapeDropdown,
    corner_3_inner_color: Property.ShortText({
      displayName: 'Corner 3 Inner Color',
      required: false,
      description:
        'Customize the inner color of the third corner of the QR code',
    }),
    corner_3_outer_color: Property.ShortText({
      displayName: 'Corner 3 Outer Color',
      required: false,
      description:
        'Customize the outer color of the third corner of the QR code',
    }),
    corner_3_shape: shapeDropdown,
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {};
    if (propsValue.title) body['title'] = propsValue.title;
    if (propsValue.group_guid) body['group_guid'] = propsValue.group_guid;
    if (propsValue.archived !== undefined)
      body['archived'] = propsValue.archived;
    const render_customization = {
      background_color: propsValue.background_color,
      dot_pattern_color: propsValue.dot_pattern_color,
      dot_pattern_type: propsValue.dot_pattern_type,
      corners: {
        corner_1: {
          inner_color: propsValue.corner_1_inner_color,
          outer_color: propsValue.corner_1_outer_color,
          shape: propsValue.corner_1_shape,
        },
        corner_2: {
          inner_color: propsValue.corner_2_inner_color,
          outer_color: propsValue.corner_2_outer_color,
          shape: propsValue.corner_2_shape,
        },
        corner_3: {
          inner_color: propsValue.corner_3_inner_color,
          outer_color: propsValue.corner_3_outer_color,
          shape: propsValue.corner_3_shape,
        },
      },
    };
    body['render_customization'] = render_customization;
    body['destination'] = {
      bitlink_id: propsValue.bitlink_id,
      long_url: propsValue.long_url,
      site_id: propsValue.site_id,
    };
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/qr-codes',
      body
    );
    return {
      success: true,
      message: `QR code created successfully.`,
      data: response,
    };
  },
});

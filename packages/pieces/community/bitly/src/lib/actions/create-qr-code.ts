import { HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { bitlyApiCall, normalizeBitlinkId, requireGuid } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid, optionalText } from '../common/props';
import { qrCodeOutputSchema } from '../common/schemas';

export const createQrCodeAction = createAction({
  auth: bitlyAuth,
  name: 'create_qr_code',
  classification: 'WRITE',
  displayName: 'Create QR Code',
  description: 'Generate a customized QR code for a Bitlink.',
  audience: 'human',
  outputSchema: qrCodeOutputSchema,
  aiMetadata: { description: 'Creates a styled QR code that points either to a raw long URL or to an existing Bitlink (selected via the destination type), with extensive optional customization of colors, dot patterns, corners, gradients, frames, branding, and error correction. Use to generate a scannable QR for a destination. Not idempotent: each call creates a new QR code.', idempotent: false },
  props: {
    group_guid: groupGuid,
    destination_type: Property.StaticDropdown({
      displayName: 'Destination Type',
      required: true,
      defaultValue: 'long_url',
      options: {
        options: [
          { label: 'Long URL', value: 'long_url' },
          { label: 'Existing Bitlink', value: 'bitlink_id' },
        ],
      },
    }),
    destination: Property.DynamicProperties({
      auth: bitlyAuth,
      displayName: 'Destination',
      required: true,
      refreshers: ['destination_type'],
      props: async (
        propsValue: Record<string, unknown>,
      ) => {
        const destination_type = propsValue['destination_type'];
        const props: DynamicPropsValue = {};
        if (destination_type === 'long_url') {
          props['long_url'] = Property.ShortText({
            displayName: 'Long URL',
            required: true,
          });
        } else if (destination_type === 'bitlink_id') {
          props['bitlink_id'] = Property.ShortText({
            displayName: 'Bitlink (e.g., bit.ly/xyz)',
            required: true,
          });
        }
        return props;
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Internal title for the QR Code.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archive on Create',
      description: 'Archive the QR code upon creation.',
      required: false,
    }),
    background_color: Property.ShortText({
      displayName: 'Style: Background Color',
      description: 'Hex code (e.g., #FFFFFF)',
      required: false,
    }),
    dot_pattern_color: Property.ShortText({
      displayName: 'Style: Dot Pattern Color',
      description: 'Hex code (e.g., #000000)',
      required: false,
    }),
    dot_pattern_type: Property.StaticDropdown({
      displayName: 'Style: Dot Pattern Type',
      required: false,
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Circle', value: 'circle' },
          { label: 'Block', value: 'block' },
          { label: 'Blob', value: 'blob' },
          { label: 'Rounded', value: 'rounded' },
          { label: 'Vertical', value: 'vertical' },
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Triangle', value: 'triangle' },
          { label: 'Heart', value: 'heart' },
          { label: 'Star', value: 'star' },
          { label: 'Diamond', value: 'diamond' },
        ],
      },
    }),
    corner_1_shape: Property.StaticDropdown({
      displayName: 'Corner 1 (Top-Left): Shape',
      required: false,
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Slightly Round', value: 'slightly_round' },
          { label: 'Rounded', value: 'rounded' },
          { label: 'Extra Round', value: 'extra_round' },
          { label: 'Leaf', value: 'leaf' },
          { label: 'Leaf Inner', value: 'leaf_inner' },
          { label: 'Leaf Outer', value: 'leaf_outer' },
          { label: 'Target', value: 'target' },
          { label: 'Concave', value: 'concave' },
        ],
      },
    }),
    corner_1_inner_color: Property.ShortText({
      displayName: 'Corner 1 (Top-Left): Inner Color',
      required: false,
    }),
    corner_1_outer_color: Property.ShortText({
      displayName: 'Corner 1 (Top-Left): Outer Color',
      required: false,
    }),
    corner_2_shape: Property.StaticDropdown({
      displayName: 'Corner 2 (Top-Right): Shape',
      required: false,
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Slightly Round', value: 'slightly_round' },
          { label: 'Rounded', value: 'rounded' },
          { label: 'Extra Round', value: 'extra_round' },
          { label: 'Leaf', value: 'leaf' },
          { label: 'Leaf Inner', value: 'leaf_inner' },
          { label: 'Leaf Outer', value: 'leaf_outer' },
          { label: 'Target', value: 'target' },
          { label: 'Concave', value: 'concave' },
        ],
      },
    }),
    corner_2_inner_color: Property.ShortText({
      displayName: 'Corner 2 (Top-Right): Inner Color',
      required: false,
    }),
    corner_2_outer_color: Property.ShortText({
      displayName: 'Corner 2 (Top-Right): Outer Color',
      required: false,
    }),
    corner_3_shape: Property.StaticDropdown({
      displayName: 'Corner 3 (Bottom-Right): Shape',
      required: false,
      options: {
        options: [
          { label: 'Standard', value: 'standard' },
          { label: 'Slightly Round', value: 'slightly_round' },
          { label: 'Rounded', value: 'rounded' },
          { label: 'Extra Round', value: 'extra_round' },
          { label: 'Leaf', value: 'leaf' },
          { label: 'Leaf Inner', value: 'leaf_inner' },
          { label: 'Leaf Outer', value: 'leaf_outer' },
          { label: 'Target', value: 'target' },
          { label: 'Concave', value: 'concave' },
        ],
      },
    }),
    corner_3_inner_color: Property.ShortText({
      displayName: 'Corner 3 (Bottom-Right): Inner Color',
      required: false,
    }),
    corner_3_outer_color: Property.ShortText({
      displayName: 'Corner 3 (Bottom-Right): Outer Color',
      required: false,
    }),
    gradient_style: Property.StaticDropdown({
      displayName: 'Gradient: Style',
      required: false,
      options: {
        options: [
          { label: 'No Gradient', value: 'no_gradient' },
          { label: 'Linear', value: 'linear' },
          { label: 'Radial', value: 'radial' },
        ],
      },
    }),
    gradient_color_1: Property.ShortText({
      displayName: 'Gradient: Color 1',
      description: 'First gradient color (hex code)',
      required: false,
    }),
    gradient_color_2: Property.ShortText({
      displayName: 'Gradient: Color 2',
      description: 'Second gradient color (hex code)',
      required: false,
    }),
    gradient_angle: Property.Number({
      displayName: 'Gradient: Angle (for Linear)',
      required: false,
    }),
    gradient_exclude_corners: Property.Checkbox({
      displayName: 'Gradient: Exclude Corners',
      required: false,
    }),
    frame_id: Property.StaticDropdown({
      displayName: 'Frame: Type',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Border Only', value: 'border_only' },
          { label: 'Text Bottom', value: 'text_bottom' },
          { label: 'Tooltip Bottom', value: 'tooltip_bottom' },
          { label: 'Arrow', value: 'arrow' },
          { label: 'Text Top', value: 'text_top' },
          { label: 'Text Bottom In Frame', value: 'text_bottom_in_frame' },
          { label: 'Script', value: 'script' },
          { label: 'Text Top and Bottom', value: 'text_top_and_bottom' },
          { label: 'URL', value: 'url' },
          { label: 'Instagram', value: 'instagram' },
        ],
      },
    }),
    frame_primary_color: Property.ShortText({
      displayName: 'Frame: Primary Color',
      required: false,
    }),
    frame_secondary_color: Property.ShortText({
      displayName: 'Frame: Secondary Color',
      required: false,
    }),
    frame_background_color: Property.ShortText({
      displayName: 'Frame: Background Color',
      required: false,
    }),
    frame_text: Property.ShortText({
      displayName: 'Frame: Text',
      description: 'Primary text for frames that support it.',
      required: false,
    }),
    logo_image_guid: Property.ShortText({
      displayName: 'Branding: Logo Image GUID',
      description: 'A GUID for a logo image previously uploaded to Bitly.',
      required: false,
    }),
    bitly_brand: Property.Checkbox({
      displayName: 'Branding: Show Bitly Logo',
      description: 'Show the Bitly logo in the bottom right corner.',
      required: false,
      defaultValue: true,
    }),
    error_correction: Property.StaticDropdown<string>({
      displayName: 'Specs: Error Correction',
      required: false,
      options: {
        options: [
          { label: 'Low (1)', value: '1' },
          { label: 'Medium (2)', value: '2' },
          { label: 'Quartile (3)', value: '3' },
          { label: 'High (4)', value: '4' },
        ],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const groupGuidValue = requireGuid({ value: props.group_guid, label: 'Group' });
    const destination = buildQrDestination({
      longUrl: props.destination?.['long_url'],
      bitlinkId: props.destination?.['bitlink_id'],
    });

    const corners = compact({
      corner_1: corner({ shape: props.corner_1_shape, inner: props.corner_1_inner_color, outer: props.corner_1_outer_color }),
      corner_2: corner({ shape: props.corner_2_shape, inner: props.corner_2_inner_color, outer: props.corner_2_outer_color }),
      corner_3: corner({ shape: props.corner_3_shape, inner: props.corner_3_inner_color, outer: props.corner_3_outer_color }),
    });

    const gradientColors = [
      ...(optionalText(props.gradient_color_1) ? [{ color: optionalText(props.gradient_color_1), offset: 0 }] : []),
      ...(optionalText(props.gradient_color_2) ? [{ color: optionalText(props.gradient_color_2), offset: 100 }] : []),
    ];
    const gradient = compact({
      style: optionalText(props.gradient_style),
      angle: typeof props.gradient_angle === 'number' ? props.gradient_angle : undefined,
      exclude_corners: props.gradient_exclude_corners === true ? true : undefined,
      colors: gradientColors.length > 0 ? gradientColors : undefined,
    });

    const frame = compact({
      id: optionalText(props.frame_id),
      colors: compact({
        primary: optionalText(props.frame_primary_color),
        secondary: optionalText(props.frame_secondary_color),
        background: optionalText(props.frame_background_color),
      }),
      text: optionalText(props.frame_text) ? { primary: { content: optionalText(props.frame_text) } } : undefined,
    });

    const customizations = compact({
      background_color: optionalText(props.background_color),
      dot_pattern_color: optionalText(props.dot_pattern_color),
      dot_pattern_type: optionalText(props.dot_pattern_type),
      corners,
      gradient,
      frame,
      branding: typeof props.bitly_brand === 'boolean' ? { bitly_brand: props.bitly_brand } : undefined,
      logo: optionalText(props.logo_image_guid) ? { image_guid: optionalText(props.logo_image_guid) } : undefined,
      spec_settings: compact({ error_correction: parseErrorCorrection(props.error_correction) }),
    });

    return bitlyApiCall({
      method: HttpMethod.POST,
      auth: context.auth.props,
      resourceUri: '/qr-codes',
      body: {
        group_guid: groupGuidValue,
        destination,
        ...(optionalText(props.title) ? { title: optionalText(props.title) } : {}),
        ...(props.archived === true ? { archived: true } : {}),
        ...(customizations ? { render_customizations: customizations } : {}),
      },
      operation: 'create QR code',
    });
  },
});

export function buildQrDestination({ longUrl, bitlinkId }: { longUrl: unknown; bitlinkId: unknown }): Record<string, string> {
  const url = optionalText(longUrl);
  const bitlink = optionalText(bitlinkId);
  if (url && bitlink) {
    throw new Error('Provide either a Long URL or a Bitlink ID as the QR code destination, not both.');
  }
  if (bitlink) {
    return { bitlink_id: normalizeBitlinkId(bitlink) };
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("A destination is required: a Long URL starting with 'http://' or 'https://', or a Bitlink ID.");
  }
  return { long_url: url };
}

function corner({ shape, inner, outer }: { shape: unknown; inner: unknown; outer: unknown }): Record<string, unknown> | undefined {
  return compact({ shape: optionalText(shape), inner_color: optionalText(inner), outer_color: optionalText(outer) });
}

function parseErrorCorrection(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const level = Number(value);
  if (![1, 2, 3, 4].includes(level)) {
    throw new Error('Error Correction must be 1, 2, 3 or 4.');
  }
  return level;
}

function compact(record: Record<string, unknown>): Record<string, unknown> | undefined {
  const entries = Object.entries(record).filter(([, v]) => v !== undefined);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

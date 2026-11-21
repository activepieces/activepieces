import { HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { bitlyApiCall } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { groupGuid } from '../common/props';

export const createQrCodeAction = createAction({
  auth: bitlyAuth,
  name: 'create_qr_code',
  classification: 'WRITE',
  displayName: 'Create QR Code',
  description: 'Generate a customized QR code for a Bitlink.',
  audience: 'both',
  aiMetadata: { description: 'Creates a styled QR code that points either to a raw long URL or to an existing Bitlink (selected via the destination type), with extensive optional customization of colors, dot patterns, corners, gradients, frames, branding, and error correction. Use to generate a scannable QR for a destination. Not idempotent: each call creates a new QR code.', idempotent: false },
  props: {
    group_guid: groupGuid,
    destination_type: Property.StaticDropdown({
      displayName: 'Destination Type',
      required: true,
      defaultValue: 'long_url',
      display: 'cards',
      options: {
        options: [
          { label: 'Long URL', value: 'long_url', description: 'A web page', icon: 'text' },
          { label: 'Bitlink', value: 'bitlink_id', description: 'Short link', icon: 'tag' },
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
        const destination_type = propsValue[
          'destination_type'
        ] as unknown as string;
        const props: DynamicPropsValue = {};
        if (destination_type === 'long_url') {
          props['long_url'] = Property.ShortText({
            displayName: 'Long URL',
            description: 'The page to open. Must start with http:// or https://.',
            placeholder: 'https://example.com/landing-page',
            required: true,
          });
        } else if (destination_type === 'bitlink_id') {
          props['bitlink_id'] = Property.ShortText({
            displayName: 'Bitlink',
            description: 'The short link, without https://.',
            placeholder: 'bit.ly/abc123',
            required: true,
          });
        }
        return props;
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Shown in your Bitly account.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archive on Create',
      description: 'Create the QR code already archived.',
      required: false,
    }),
    background_color: Property.ShortText({
      displayName: 'Background Color',
      description: 'Hex color code.',
      placeholder: '#FFFFFF',
      required: false,
      width: 'half',
    }),
    dot_pattern_color: Property.ShortText({
      displayName: 'Dot Color',
      description: 'Hex color code.',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    dot_pattern_type: Property.StaticDropdown({
      displayName: 'Dot Pattern',
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
      displayName: 'Shape',
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
      displayName: 'Inner Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    corner_1_outer_color: Property.ShortText({
      displayName: 'Outer Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    corner_2_shape: Property.StaticDropdown({
      displayName: 'Shape',
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
      displayName: 'Inner Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    corner_2_outer_color: Property.ShortText({
      displayName: 'Outer Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    corner_3_shape: Property.StaticDropdown({
      displayName: 'Shape',
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
      displayName: 'Inner Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    corner_3_outer_color: Property.ShortText({
      displayName: 'Outer Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    gradient_style: Property.StaticDropdown({
      displayName: 'Type',
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
      displayName: 'Start Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    gradient_color_2: Property.ShortText({
      displayName: 'End Color',
      placeholder: '#FFFFFF',
      required: false,
      width: 'half',
    }),
    gradient_angle: Property.Number({
      displayName: 'Angle',
      description: 'Degrees, used by linear gradients only.',
      required: false,
    }),
    gradient_exclude_corners: Property.Checkbox({
      displayName: 'Exclude Corners',
      description: 'Keep the corners out of the gradient.',
      required: false,
    }),
    frame_id: Property.StaticDropdown({
      displayName: 'Style',
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
      displayName: 'Primary Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    frame_secondary_color: Property.ShortText({
      displayName: 'Secondary Color',
      placeholder: '#000000',
      required: false,
      width: 'half',
    }),
    frame_background_color: Property.ShortText({
      displayName: 'Background Color',
      placeholder: '#FFFFFF',
      required: false,
    }),
    frame_text: Property.ShortText({
      displayName: 'Text',
      description: 'Shown by frames that have a text area.',
      required: false,
    }),
    logo_image_guid: Property.ShortText({
      displayName: 'Logo Image ID',
      description: 'ID of a logo image you uploaded to Bitly.',
      required: false,
    }),
    bitly_brand: Property.Checkbox({
      displayName: 'Show Bitly Logo',
      description: 'Adds the Bitly logo to the bottom right corner.',
      required: false,
      defaultValue: true,
    }),
    error_correction: Property.StaticDropdown({
      displayName: 'Error Correction',
      description: 'Higher keeps the code readable with a logo or damage.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 1 },
          { label: 'Medium', value: 2 },
          { label: 'Quartile', value: 3 },
          { label: 'High', value: 4 },
        ],
      },
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Target', icon: 'send', props: ['group_guid', 'destination_type', 'destination'] },
    { key: 'details', display: 'section', label: 'Details', icon: 'type', props: ['title', 'archived'] },
    { key: 'style', display: 'section', label: 'Style', icon: 'sliders', props: ['background_color', 'dot_pattern_color', 'dot_pattern_type'] },
    { key: 'corner_1', display: 'section', label: 'Top-Left Corner', icon: 'sliders', props: ['corner_1_shape', 'corner_1_inner_color', 'corner_1_outer_color'] },
    { key: 'corner_2', display: 'section', label: 'Top-Right Corner', icon: 'sliders', props: ['corner_2_shape', 'corner_2_inner_color', 'corner_2_outer_color'] },
    { key: 'corner_3', display: 'section', label: 'Bottom-Right Corner', icon: 'sliders', props: ['corner_3_shape', 'corner_3_inner_color', 'corner_3_outer_color'] },
    { key: 'gradient', display: 'section', label: 'Gradient', icon: 'sliders', props: ['gradient_style', 'gradient_color_1', 'gradient_color_2', 'gradient_angle', 'gradient_exclude_corners'] },
    { key: 'frame', display: 'section', label: 'Frame', icon: 'blank', props: ['frame_id', 'frame_text', 'frame_primary_color', 'frame_secondary_color', 'frame_background_color'] },
    { key: 'branding', display: 'section', label: 'Branding', icon: 'file', props: ['logo_image_guid', 'bitly_brand', 'error_correction'] },
  ],
  async run(context) {
    const props = context.propsValue;

    try {
      const body: any = {
        group_guid: props.group_guid,
        destination: { ...props.destination },
      };
      if (props.title) body.title = props.title;
      if (props.archived) body.archived = props.archived;

      const customizations: any = {};
      if (props.background_color)
        customizations.background_color = props.background_color;
      if (props.dot_pattern_color)
        customizations.dot_pattern_color = props.dot_pattern_color;
      if (props.dot_pattern_type)
        customizations.dot_pattern_type = props.dot_pattern_type;

      const corners: any = {};
      if (
        props.corner_1_shape ||
        props.corner_1_inner_color ||
        props.corner_1_outer_color
      )
        corners.corner_1 = {
          shape: props.corner_1_shape,
          inner_color: props.corner_1_inner_color,
          outer_color: props.corner_1_outer_color,
        };
      if (
        props.corner_2_shape ||
        props.corner_2_inner_color ||
        props.corner_2_outer_color
      )
        corners.corner_2 = {
          shape: props.corner_2_shape,
          inner_color: props.corner_2_inner_color,
          outer_color: props.corner_2_outer_color,
        };
      if (
        props.corner_3_shape ||
        props.corner_3_inner_color ||
        props.corner_3_outer_color
      )
        corners.corner_3 = {
          shape: props.corner_3_shape,
          inner_color: props.corner_3_inner_color,
          outer_color: props.corner_3_outer_color,
        };
      if (Object.keys(corners).length > 0) customizations.corners = corners;

      const gradient: any = {};
      if (props.gradient_style) gradient.style = props.gradient_style;
      if (props.gradient_angle) gradient.angle = props.gradient_angle;
      if (props.gradient_exclude_corners)
        gradient.exclude_corners = props.gradient_exclude_corners;
      
      // Build gradient colors array from individual color inputs
      if (props.gradient_color_1 || props.gradient_color_2) {
        const colors = [];
        if (props.gradient_color_1) {
          colors.push({ color: props.gradient_color_1, offset: 0 });
        }
        if (props.gradient_color_2) {
          colors.push({ color: props.gradient_color_2, offset: 100 });
        }
        gradient.colors = colors;
      }
      if (Object.keys(gradient).length > 0) customizations.gradient = gradient;

      const frame: any = {};
      if (props.frame_id) frame.id = props.frame_id;
      const frameColors: any = {};
      if (props.frame_primary_color)
        frameColors.primary = props.frame_primary_color;
      if (props.frame_secondary_color)
        frameColors.secondary = props.frame_secondary_color;
      if (props.frame_background_color)
        frameColors.background = props.frame_background_color;
      if (Object.keys(frameColors).length > 0) frame.colors = frameColors;
      if (props.frame_text)
        frame.text = { primary: { content: props.frame_text } };
      if (Object.keys(frame).length > 0) customizations.frame = frame;

      const branding: any = {};
      if (props.bitly_brand !== undefined)
        branding.bitly_brand = props.bitly_brand;
      if (Object.keys(branding).length > 0) customizations.branding = branding;

      const logo: any = {};
      if (props.logo_image_guid) logo.image_guid = props.logo_image_guid;
      if (Object.keys(logo).length > 0) customizations.logo = logo;

      const specSettings: any = {};
      if (props.error_correction)
        specSettings.error_correction = props.error_correction;
      if (Object.keys(specSettings).length > 0)
        customizations.spec_settings = specSettings;

      if (Object.keys(customizations).length > 0)
        body.render_customizations = customizations;

      return await bitlyApiCall({
        method: HttpMethod.POST,
        auth: context.auth.props,
        resourceUri: '/qr-codes',
        body,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.description ||
        error.response?.data?.message ||
        error.message;

      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait before trying again.'
        );
      }

      if (error.response?.status === 422) {
        throw new Error(
          `Unprocessable Entity: ${errorMessage}. Please check the format of your Long URL or other inputs.`
        );
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          `Authentication failed or forbidden: ${errorMessage}. Please check your Access Token and permissions.`
        );
      }

      throw new Error(
        `Failed to create QR Code: ${errorMessage || 'Unknown error occurred'}`
      );
    }
  },
});

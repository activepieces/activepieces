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
  displayName: 'Create QR Code',
  description: 'Generate a customized QR code for a Bitlink.',
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
      displayName: 'Destination',
      required: true,
      refreshers: ['destination_type'],
      props: async (
        propsValue: Record<string, DynamicPropsValue>,
        ctx: any
      ) => {
        const destination_type = propsValue[
          'destination_type'
        ] as unknown as string;
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
    error_correction: Property.StaticDropdown({
      displayName: 'Specs: Error Correction',
      required: false,
      options: {
        options: [
          { label: 'Low (1)', value: 1 },
          { label: 'Medium (2)', value: 2 },
          { label: 'Quartile (3)', value: 3 },
          { label: 'High (4)', value: 4 },
        ],
      },
    }),
  },
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
        auth: context.auth,
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

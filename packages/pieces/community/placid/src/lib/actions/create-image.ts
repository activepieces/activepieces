import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';
import { templateUuid } from '../common/props';

export const createImageAction = createAction({
  name: 'create-image',
  auth: placidAuth,
  displayName: 'Create Image',
  description:
    'Generate a dynamic image from a specified template using input data.',
  props: {
    template_uuid: templateUuid,
    webhook_success: Property.ShortText({
      displayName: 'Webhook Success URL',
      required: false,
    }),
    create_now: Property.Checkbox({
      displayName: 'Create Now',
      required: false,
      defaultValue: false,
    }),
    passthrough: Property.ShortText({
      displayName: 'Passthrough',
      required: false,
    }),
    layers: Property.Json({
      displayName: 'Layers',
      required: false,
      description:
        'Provide all applicable layer properties using layer names from your Placid template.',
    }),
    to: Property.StaticDropdown({
      displayName: 'Transfer Destination',
      required: false,
      defaultValue: 's3',
      options: {
        disabled: false,
        options: [{ label: 'Amazon S3', value: 's3' }],
      },
    }),
    key: Property.ShortText({
      displayName: 'AWS Access Key',
      required: false,
    }),
    secret: Property.ShortText({
      displayName: 'AWS Secret Key',
      required: false,
    }),
    token: Property.ShortText({
      displayName: 'AWS STS Token (Optional)',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      required: false,
      defaultValue: 'us-east-1',
    }),
    bucket: Property.ShortText({
      displayName: 'Bucket Name',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      required: false,
      description: 'e.g. `images/output.png` (will overwrite existing files)',
    }),
    endpoint: Property.ShortText({
      displayName: 'S3 Endpoint',
      required: false,
      defaultValue: 'https://s3.amazonaws.com',
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      defaultValue: 'public',
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    modifications_width: Property.ShortText({
      displayName: 'Image Width',
      required: false,
      description: 'Image width (e.g., 1200). Aspect ratio will be preserved.',
    }),
    modifications_height: Property.ShortText({
      displayName: 'Image Height',
      required: false,
      description: 'Image height (e.g., 800). Aspect ratio will be preserved.',
    }),
    modifications_filename: Property.ShortText({
      displayName: 'Filename',
      required: false,
      description:
        'Custom filename for the generated image (e.g., banner.png).',
    }),
    modifications_image_format: Property.StaticDropdown({
      displayName: 'Image Format',
      required: false,
      defaultValue: 'auto',
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'JPG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'WebP', value: 'webp' },
        ],
      },
    }),
    modifications_dpi: Property.StaticDropdown({
      displayName: 'DPI',
      required: false,
      defaultValue: '72',
      options: {
        disabled: false,
        options: [
          { label: '72', value: '72' },
          { label: '150', value: '150' },
          { label: '300', value: '300' },
        ],
      },
    }),
    modifications_color_mode: Property.StaticDropdown({
      displayName: 'Color Mode',
      required: false,
      defaultValue: 'rgb',
      options: {
        disabled: false,
        options: [
          { label: 'RGB', value: 'rgb' },
          { label: 'CMYK', value: 'cmyk' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    try {
      const {
        template_uuid,
        webhook_success,
        create_now,
        passthrough,
        to,
        key,
        secret,
        token,
        region,
        bucket,
        path,
        endpoint,
        visibility,
				layers,
        modifications_width,
        modifications_height,
        modifications_filename,
        modifications_image_format,
        modifications_dpi,
        modifications_color_mode,
      } = propsValue;

      const modifications: Record<string, any> = {};
      if (modifications_width) modifications['width'] = modifications_width;
      if (modifications_height) modifications['height'] = modifications_height;
      if (modifications_filename)
        modifications['filename'] = modifications_filename;
      if (modifications_image_format)
        modifications['image_format'] = modifications_image_format;
      if (modifications_dpi) modifications['dpi'] = modifications_dpi;
      if (modifications_color_mode)
        modifications['color_mode'] = modifications_color_mode;

      const transfer: Record<string, any> = {};
      if (to) transfer['to'] = to;
      if (key) transfer['key'] = key;
      if (secret) transfer['secret'] = secret;
      if (token) transfer['token'] = token;
      if (region) transfer['region'] = region;
      if (bucket) transfer['bucket'] = bucket;
      if (path) transfer['path'] = path;
      if (endpoint) transfer['endpoint'] = endpoint;
      if (visibility) transfer['visibility'] = visibility;

      const body = {
        template_uuid,
        webhook_success,
        create_now,
        passthrough,
        layers,
        modifications: Object.keys(modifications).length
          ? modifications
          : undefined,
        transfer: Object.keys(transfer).length ? transfer : undefined,
      };

      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.POST,
        resourceUri: '/images',
        body,
      });

      return {
        success: true,
        message: 'Image created successfully',
        response,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error(
            'Unauthorized: Invalid API key. Please verify your credentials.'
          );
        case 404:
          throw new Error(
            'Resource Not Found: Please check template UUID or layer config.'
          );
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Internal server error. Please try again.');
        default:
          throw new Error(
            `Placid API Error (${status || 'Unknown'}): ${message}`
          );
      }
    }
  },
});

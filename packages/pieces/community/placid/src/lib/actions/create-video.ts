import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';
import { templateUuid } from '../common/props';

export const createVideoAction = createAction({
  name: 'create-video',
  auth: placidAuth,
  displayName: 'Create Video',
  description: 'Generate a dynamic video using one or more templates and clip data.',
  props: {
    webhook_success: Property.ShortText({
      displayName: 'Webhook Success URL',
      required: false,
    }),
    passthrough: Property.ShortText({
      displayName: 'Passthrough',
      required: false,
    }),
    clips: Property.Json({
      displayName: 'Clips',
      required: false,
      description: `Array of clip objects (template_uuid, audio, layers, etc).`,
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
      description: 'e.g. `videos/my-video.mp4` (will overwrite existing files)',
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
      displayName: 'Video Width',
      required: false,
      description: 'Leave empty to auto size based on first clip.',
    }),
    modifications_height: Property.ShortText({
      displayName: 'Video Height',
      required: false,
      description: 'Leave empty to auto size based on first clip.',
    }),
    modifications_fps: Property.ShortText({
      displayName: 'Frames Per Second (FPS)',
      required: false,
      description: 'Defaults to 25. Allowed: 1-30',
    }),
    modifications_filename: Property.ShortText({
      displayName: 'Filename',
      required: false,
      description: 'Output filename (e.g., my-video.mp4)',
    }),
    modifications_canvas_background: Property.ShortText({
      displayName: 'Canvas Background',
      required: false,
      description: 'Default: #000000. Use `blur` for blurred background.',
    }),
  },

  async run({ propsValue, auth }) {
    try {
      const {
        webhook_success,
        passthrough,
        clips,
        to,
        key,
        secret,
        token,
        region,
        bucket,
        path,
        endpoint,
        visibility,
        modifications_width,
        modifications_height,
        modifications_fps,
        modifications_filename,
        modifications_canvas_background,
      } = propsValue;

      const transfer: Record<string, any> = {
        to,
        key,
        secret,
        region,
        bucket,
        path,
        visibility,
      };
      if (endpoint) transfer['endpoint'] = endpoint;
      if (token) transfer['token'] = token;

      const modifications: Record<string, any> = {};
      if (modifications_width) modifications['width'] = modifications_width;
      if (modifications_height) modifications['height'] = modifications_height;
      if (modifications_fps) modifications['fps'] = modifications_fps;
      if (modifications_filename) modifications['filename'] = modifications_filename;
      if (modifications_canvas_background)
        modifications['canvas_background'] = modifications_canvas_background;

      const body = {
        webhook_success,
        passthrough,
        clips,
        transfer,
        modifications: Object.keys(modifications).length ? modifications : undefined,
      };

      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.POST,
        resourceUri: '/videos',
        body,
      });

      return {
        success: true,
        message: 'Video created successfully',
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
          throw new Error('Not Found: Template or resource was not found.');
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

import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video file to your Canva media library.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The image or video file to upload.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Display name for the uploaded asset.',
      required: true,
    }),
    mime_type: Property.StaticDropdown({
      displayName: 'MIME Type',
      description: 'MIME type of the file being uploaded.',
      required: true,
      defaultValue: 'image/png',
      options: {
        options: [
          { label: 'PNG image', value: 'image/png' },
          { label: 'JPEG image', value: 'image/jpeg' },
          { label: 'GIF image', value: 'image/gif' },
          { label: 'WebP image', value: 'image/webp' },
          { label: 'SVG image', value: 'image/svg+xml' },
          { label: 'MP4 video', value: 'video/mp4' },
          { label: 'PDF document', value: 'application/pdf' },
        ],
      },
    }),
  },
  async run(context) {
    const { file, name, mime_type } = context.propsValue;

    // Canva asset upload: POST /rest/v1/asset-uploads
    // Content-Type: application/octet-stream
    // Asset-Upload-Metadata: base64-encoded JSON with name_base64 + mime_type
    const metadata = Buffer.from(
      JSON.stringify({
        name_base64: Buffer.from(name).toString('base64'),
        mime_type,
      })
    ).toString('base64');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/asset-uploads',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': metadata,
      },
      body: Buffer.from(file.base64, 'base64'),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});

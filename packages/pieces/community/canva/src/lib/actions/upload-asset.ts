import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description:
    'Upload an image or video asset to the Canva asset library from a publicly accessible URL. Useful for auto-uploading brand assets when a campaign starts.',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'A name for the uploaded asset.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Asset URL',
      description: 'Publicly accessible URL of the asset to upload.',
      required: true,
    }),
    mimeType: Property.StaticDropdown({
      displayName: 'Asset Type',
      description: 'The MIME type of the asset.',
      required: true,
      options: {
        options: [
          { label: 'PNG Image', value: 'image/png' },
          { label: 'JPEG Image', value: 'image/jpeg' },
          { label: 'GIF Image', value: 'image/gif' },
          { label: 'WebP Image', value: 'image/webp' },
          { label: 'SVG Image', value: 'image/svg+xml' },
          { label: 'MP4 Video', value: 'video/mp4' },
          { label: 'MOV Video', value: 'video/quicktime' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Optional tags to categorize the asset.',
      required: false,
    }),
  },
  async run(context) {
    const { name, url, mimeType, tags } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body: Record<string, unknown> = {
      name,
      url,
      mime_type: mimeType,
    };

    if (tags && (tags as unknown[]).length > 0) {
      body['tags'] = tags;
    }

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.POST,
      path: '/assets/upload',
      body,
    });

    return response;
  },
});

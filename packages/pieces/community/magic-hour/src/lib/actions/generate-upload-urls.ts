import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourApi } from '../common/client';

export const generateUploadUrlsAction = createAction({
  auth: magicHourAuth,
  name: 'generate_upload_urls',
  classification: 'WRITE',
  displayName: 'Generate Asset Upload URLs',
  description: 'Create signed URLs for uploading source media to Magic Hour.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create ordered, expiring upload URLs and Magic Hour file paths for source images, videos, or audio. Use before a generation action when the input is not already available at a direct public URL. Each call creates new signed URLs.',
    idempotent: false,
  },
  props: {
    items: Property.Array({
      displayName: 'Assets',
      description:
        'Assets that will be uploaded. The response preserves this order.',
      required: true,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Asset Type',
          description: 'The kind of media being uploaded.',
          required: true,
          options: {
            options: [
              { label: 'Image', value: 'image' },
              { label: 'Video', value: 'video' },
              { label: 'Audio', value: 'audio' },
            ],
          },
        }),
        extension: Property.ShortText({
          displayName: 'File Extension',
          description:
            'Lowercase extension without a dot, such as png, mp4, or mp3.',
          required: true,
          placeholder: 'png',
        }),
      },
    }),
  },
  async run(context) {
    return magicHourApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/files/upload-urls',
      body: { items: context.propsValue.items },
    });
  },
});

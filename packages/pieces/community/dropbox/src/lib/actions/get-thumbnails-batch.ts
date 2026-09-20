import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { thumbnailBatchOutputSchema } from '../output-schemas';

export const dropboxGetThumbnailsBatch = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_thumbnails_batch',
  classification: 'READ',
  displayName: 'Get Thumbnails (Batch)',
  description: 'Get thumbnails for several files at once',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns base64-encoded thumbnails for up to 25 Dropbox image files in one call. Use to preview many images at once; use Get File Thumbnail for a single file you want as a downloadable file object. Read-only.',
    idempotent: true,
  },
  outputSchema: thumbnailBatchOutputSchema,
  props: {
    paths: Property.Array({
      displayName: 'Paths',
      description:
        'The image files to thumbnail, at most 25. Each accepts a path (/folder/photo.jpg), an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'jpeg',
      options: {
        options: [
          { label: 'JPEG', value: 'jpeg' },
          { label: 'PNG', value: 'png' },
          { label: 'WebP', value: 'webp' },
        ],
      },
    }),
    size: Property.StaticDropdown({
      displayName: 'Size',
      required: false,
      defaultValue: 'w64h64',
      options: {
        options: [
          { label: '32x32', value: 'w32h32' },
          { label: '64x64', value: 'w64h64' },
          { label: '128x128', value: 'w128h128' },
          { label: '256x256', value: 'w256h256' },
          { label: '480x320', value: 'w480h320' },
          { label: '640x480', value: 'w640h480' },
          { label: '960x640', value: 'w960h640' },
          { label: '1024x768', value: 'w1024h768' },
          { label: '2048x1536', value: 'w2048h1536' },
        ],
      },
    }),
  },
  async run(context) {
    const paths = context.propsValue.paths as string[];
    if (paths.length === 0) {
      throw new Error('Provide at least one path to thumbnail.');
    }
    if (paths.length > 25) {
      throw new Error('Dropbox accepts at most 25 paths per thumbnail batch.');
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      host: dropboxCommon.CONTENT_HOST,
      path: '/files/get_thumbnail_batch',
      body: {
        entries: paths.map((path) => ({
          path,
          format: context.propsValue.format ?? 'jpeg',
          size: context.propsValue.size ?? 'w64h64',
        })),
      },
    });
  },
});

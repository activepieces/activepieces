import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { fileThumbnailOutputSchema } from '../output-schemas';

export const dropboxGetFileThumbnail = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_file_thumbnail',
  classification: 'READ',
  displayName: 'Get File Thumbnail',
  description: 'Get a thumbnail image for a file',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns a thumbnail image for a single Dropbox image file as a file object, with its metadata. Supports jpg, jpeg, png, tiff, tif, gif, webp, ppm and bmp under 20 MB; use Get Thumbnails (Batch) for many files at once. Read-only.',
    idempotent: true,
  },
  outputSchema: fileThumbnailOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The image file to thumbnail. Accepts a path (/folder/photo.jpg), an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
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
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Strict keeps the requested dimensions exactly; the bestfit modes preserve the aspect ratio.',
      required: false,
      defaultValue: 'strict',
      options: {
        options: [
          { label: 'Strict', value: 'strict' },
          { label: 'Best Fit', value: 'bestfit' },
          { label: 'Fit One, Best Fit', value: 'fitone_bestfit' },
        ],
      },
    }),
  },
  async run(context) {
    const format = context.propsValue.format ?? 'jpeg';
    const baseName = (context.propsValue.path.match(/[^/]+$/) ?? ['thumbnail'])[0];
    const { data, result } = await dropboxCommon.download({
      auth: context.auth.access_token,
      path: '/files/get_thumbnail_v2',
      arg: {
        resource: { '.tag': 'path', path: context.propsValue.path },
        format,
        size: context.propsValue.size ?? 'w64h64',
        mode: context.propsValue.mode ?? 'strict',
      },
    });
    return {
      file: await context.files.write({
        fileName: `${baseName.replace(/\.[^.]+$/, '')}.${
          format === 'jpeg' ? 'jpg' : format
        }`,
        data,
      }),
      metadata: result,
    };
  },
});

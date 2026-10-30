import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import FormData from 'form-data';
import { ghostUploadImageOutputSchema } from '../../output-schemas';

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  ico: 'image/x-icon',
};

export const ghostUploadImage = createAction({
  auth: ghostAuth,
  name: 'ghost_upload_image',
  outputSchema: ghostUploadImageOutputSchema,
  classification: 'WRITE',
  displayName: 'Upload Image',
  description: 'Upload an image to Ghost and get its URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a PNG, JPG, GIF, WebP, SVG or ICO image to the Ghost media library and returns its public URL, to use as a post Feature Image URL or inside post HTML. Each call stores a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Image',
      description: 'The image file to upload.',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description: 'How Ghost validates the image. Defaults to a content image.',
      required: false,
      defaultValue: 'image',
      options: {
        options: [
          { label: 'Content or feature image', value: 'image' },
          { label: 'Profile image (square)', value: 'profile_image' },
          { label: 'Site icon (square)', value: 'icon' },
        ],
      },
    }),
    ref: Property.ShortText({
      displayName: 'Reference',
      description: 'An optional value returned unchanged, e.g. the original file name.',
      required: false,
    }),
  },
  async run(context) {
    const { file, purpose, ref } = context.propsValue;
    const filename = file.filename || 'image';
    const extension = (file.extension || filename.split('.').pop() || '').toLowerCase();
    const mimeType = MIME_TYPES[extension];
    if (!mimeType) {
      throw new Error(`Unsupported image type "${extension}". Use PNG, JPG, GIF, WebP, SVG or ICO.`);
    }
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.base64, 'base64');
    const form = new FormData();
    form.append('file', data, { filename, contentType: mimeType });
    form.append('purpose', purpose || 'image');
    if (ref && ref.trim()) {
      form.append('ref', ref.trim());
    }
    const response = await ghostClient.request<{ images?: { url: string; ref: string | null }[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/images/upload',
      body: form,
    });
    const image = response.images?.[0];
    if (!image) {
      throw new Error('Ghost did not return the uploaded image.');
    }
    return { url: image.url, ref: image.ref ?? null };
  },
});

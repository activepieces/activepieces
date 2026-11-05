import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

type FileLike = { filename: string; data: Buffer; extension?: string };

function asFile({ value, index }: { value: unknown; index: number }): FileLike {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Image ${index + 1} is not a file.`);
  }
  const data: unknown = Reflect.get(value, 'data');
  const filename: unknown = Reflect.get(value, 'filename');
  if (!Buffer.isBuffer(data)) {
    throw new Error(`Image ${index + 1} is not a file.`);
  }
  const name = typeof filename === 'string' && filename.length > 0 ? filename : `image-${index + 1}`;
  const extension: unknown = Reflect.get(value, 'extension');
  return { filename: name, data, extension: typeof extension === 'string' ? extension : undefined };
}

function mimeOf(file: FileLike): string | undefined {
  const extension = (file.extension ?? file.filename.split('.').pop() ?? '').toLowerCase().replace(/^\./, '');
  return MIME_BY_EXTENSION[extension];
}

function imageIdsOf(body: unknown): string[] {
  if (Array.isArray(body)) {
    return body.flatMap((item) => (typeof item === 'string' ? [item] : imageIdsOf(item)));
  }
  if (typeof body !== 'object' || body === null) {
    return [];
  }
  for (const key of ['image_ids', 'ids']) {
    const value: unknown = Reflect.get(body, key);
    if (Array.isArray(value)) {
      return value.map(String);
    }
  }
  const images: unknown = Reflect.get(body, 'images');
  if (Array.isArray(images)) {
    return imageIdsOf(images);
  }
  const id: unknown = Reflect.get(body, 'image_id') ?? Reflect.get(body, 'id');
  return typeof id === 'string' ? [id] : [];
}

export const uploadImages = createAction({
  auth: alaiAuth,
  name: 'uploadImages',
  classification: 'WRITE',
  displayName: 'Upload Images',
  description: 'Upload up to 10 images (PNG, JPEG, WebP, GIF, AVIF or SVG, 10 MB each) to use in a new presentation.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.uploadImages,
  aiMetadata: {
    description:
      'Uploads 1-10 image files (png, jpeg, webp, gif, avif, svg; 10 MB each) to Alai and returns image_ids to pass to Generate Presentation. Not idempotent: each call stores new copies.',
    idempotent: false,
  },
  props: {
    images: Property.Array({
      displayName: 'Images',
      description: 'Up to 10 image files.',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'Image',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const entries = (propsValue.images ?? []).map((item) =>
      typeof item === 'object' && item !== null && 'file' in item ? Reflect.get(item, 'file') : item
    );
    if (entries.length === 0) {
      throw new Error('Add at least one image.');
    }
    if (entries.length > MAX_FILES) {
      throw new Error(`Alai accepts at most ${MAX_FILES} images per upload; got ${entries.length}.`);
    }
    const form = new FormData();
    entries.forEach((entry, index) => {
      const file = asFile({ value: entry, index });
      const mime = mimeOf(file);
      if (!mime) {
        throw new Error(`"${file.filename}" is not a supported image type (png, jpeg, webp, gif, avif, svg).`);
      }
      if (file.data.length > MAX_BYTES) {
        throw new Error(`"${file.filename}" is larger than 10 MB.`);
      }
      form.append('files', new Blob([new Uint8Array(file.data)], { type: mime }), file.filename);
    });
    const body = await alaiClient.request<unknown>({
      apiKey: auth.props.apiKey,
      method: HttpMethod.POST,
      path: '/upload-images',
      body: form,
    });
    const imageIds = imageIdsOf(body);
    if (imageIds.length === 0) {
      throw new Error(`Alai did not return image IDs: ${JSON.stringify(body).slice(0, 300)}`);
    }
    return { image_ids: imageIds, count: imageIds.length, response: body };
  },
});

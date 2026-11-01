import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import FormData from 'form-data';
import { ghostUploadMediaOutputSchema } from '../../output-schemas';

const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
};

export const ghostUploadMedia = createAction({
  auth: ghostAuth,
  name: 'ghost_upload_media',
  outputSchema: ghostUploadMediaOutputSchema,
  classification: 'WRITE',
  displayName: 'Upload Media',
  description: 'Upload a video or audio file to Ghost and get its URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads an MP4, WebM, OGV, MP3, WAV, OGG or M4A file to the Ghost media library and returns its public URL, to embed in post HTML as a video or audio card. Use Upload Image for pictures and Upload File for any other download. Each call stores a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Media File',
      description: 'The video or audio file to upload.',
      required: true,
    }),
    ref: Property.ShortText({
      displayName: 'Reference',
      description: 'An optional value returned unchanged, e.g. the original file name.',
      required: false,
    }),
  },
  async run(context) {
    const { file, ref } = context.propsValue;
    const filename = file.filename || 'media';
    const extension = (file.extension || filename.split('.').pop() || '').toLowerCase();
    const mimeType = MIME_TYPES[extension];
    if (!mimeType) {
      throw new Error(
        `Unsupported media type "${extension}". Use MP4, WebM, OGV, MP3, WAV, OGG or M4A.`
      );
    }
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.base64, 'base64');
    const form = new FormData();
    form.append('file', data, { filename, contentType: mimeType });
    if (ref && ref.trim()) {
      form.append('ref', ref.trim());
    }
    const response = await ghostClient.request<{
      media?: { url: string; thumbnail_url: string | null; ref: string | null }[];
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/media/upload',
      body: form,
    });
    const media = response.media?.[0];
    if (!media) {
      throw new Error('Ghost did not return the uploaded media.');
    }
    return {
      url: media.url,
      thumbnail_url: media.thumbnail_url ?? null,
      ref: media.ref ?? null,
    };
  },
});

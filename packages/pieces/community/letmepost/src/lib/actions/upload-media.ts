import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostClient } from '../common/client';
import { uploadMediaOutputSchema } from '../common/output-schemas';

function fileNameOf({ filename, extension }: { filename: unknown; extension: unknown }): string {
  const name = letmepostClient.optionalText(filename);
  if (name !== undefined) return name;
  const ext = letmepostClient.optionalText(extension);
  return ext === undefined ? 'upload' : `upload.${ext.replace(/^\./, '')}`;
}

const MAX_BYTES = 200 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 300_000;

export const uploadMedia = createAction({
  auth: letmepostAuth,
  name: 'upload_media',
  classification: 'WRITE',
  displayName: 'Upload Media',
  description: 'Upload an image or video to letmepost to reuse in posts',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads one image or video file (up to 200 MB) to letmepost and returns its media id (med_…) and CDN URL. Use the id as Media ID in Publish or Schedule a Post or Reply to a Post; to reuse an earlier upload, find it with List Media instead. Each call stores a new media asset.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The image or video to upload. The type is detected from the file contents.',
      required: true,
    }),
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Place the upload under this profile. Leave empty with a profile-scoped API key.',
      required: false,
    }),
  },
  outputSchema: uploadMediaOutputSchema,
  async run(context) {
    const file: unknown = context.propsValue.file;
    if (!letmepostClient.isFileLike(file)) {
      throw new Error('File is required. Map a file from an earlier step or upload one.');
    }
    if (file.data.length === 0) {
      throw new Error('The file is empty.');
    }
    if (file.data.length > MAX_BYTES) {
      throw new Error('The file is larger than 200 MB, the letmepost upload limit.');
    }
    const form = new FormData();
    form.append('file', new Blob([file.data]), fileNameOf({ filename: file.filename, extension: file.extension }));
    return letmepostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/v1/media',
      query: { profileId: letmepostClient.optionalText(context.propsValue.profileId) },
      body: form,
      redactBody: true,
      timeoutMs: UPLOAD_TIMEOUT_MS,
      operation: 'upload the media',
    });
  },
});

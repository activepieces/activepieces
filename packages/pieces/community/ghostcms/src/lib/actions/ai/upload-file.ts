import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import FormData from 'form-data';
import { ghostUploadFileOutputSchema } from '../../output-schemas';

export const ghostUploadFile = createAction({
  auth: ghostAuth,
  name: 'ghost_upload_file',
  outputSchema: ghostUploadFileOutputSchema,
  classification: 'WRITE',
  displayName: 'Upload File',
  description: 'Upload a downloadable file (PDF, ZIP, CSV and more) to Ghost and get its URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a file such as a PDF, ZIP, CSV, DOCX or EPUB to Ghost and returns its public URL, to link from a post as a file card or download. Ghost only accepts known extensions; zip anything else. Use Upload Image or Upload Media for pictures, video and audio. Each call stores a new file.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Its name must end with a supported extension, e.g. .pdf or .zip.',
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
    const filename = file.filename || 'file';
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.base64, 'base64');
    const form = new FormData();
    form.append('file', data, { filename, contentType: 'application/octet-stream' });
    if (ref && ref.trim()) {
      form.append('ref', ref.trim());
    }
    const response = await ghostClient.request<{
      files?: { url: string; ref: string | null }[];
    }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/files/upload',
      body: form,
    });
    const uploaded = response.files?.[0];
    if (!uploaded) {
      throw new Error('Ghost did not return the uploaded file.');
    }
    return { url: uploaded.url, ref: uploaded.ref ?? null };
  },
});

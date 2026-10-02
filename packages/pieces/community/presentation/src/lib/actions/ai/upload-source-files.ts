import FormData from 'form-data';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationUploadSourceFilesOutputSchema } from '../../output-schemas';

export const uploadSourceFiles = createAction({
  auth: presentonAuth,
  name: 'presentation_upload_source_files',
  outputSchema: presentationUploadSourceFilesOutputSchema,
  displayName: 'Upload Source Files',
  description: 'Upload documents to use as source material for a presentation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads one or more files and returns their ids. Pass the ids as files to presentation_generate_presentation or presentation_generate_outline. Each call stores new copies, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    files: Property.Array({
      displayName: 'Files',
      required: true,
      properties: {
        file: Property.File({ displayName: 'File', required: true }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const items = Array.isArray(propsValue.files) ? propsValue.files : [];
    if (items.length === 0) {
      throw new Error('At least one file is required.');
    }
    const form = new FormData();
    items.forEach((item) => {
      if (typeof item === 'object' && item !== null && 'file' in item) {
        const file = item.file;
        if (
          typeof file === 'object' && file !== null &&
          'data' in file && 'filename' in file &&
          Buffer.isBuffer(file.data) && typeof file.filename === 'string'
        ) {
          form.append('files', file.data, file.filename);
        }
      }
    });
    return presentonClient.request<unknown[]>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/files/upload',
      body: form,
      headers: form.getHeaders(),
    });
  },
});

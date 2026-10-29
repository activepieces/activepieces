import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropUploadFileOutputSchema } from '../../../output-schemas';

export const raindropUploadFileAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_upload_file',
  outputSchema: raindropUploadFileOutputSchema,
  displayName: 'Upload File',
  description: 'Uploads a file and saves it as a new bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file (image, PDF, document) to Raindrop.io and saves it as a new bookmark in Unsorted; move it with Update Bookmark. Use Create Bookmark to save a web URL instead. Not idempotent: each call stores another copy.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('file', new Blob([propsValue.file.data]), propsValue.file.filename);
    return await raindropClient.request<RaindropUploadFileResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/raindrop/file',
      body: form,
    });
  },
});

type RaindropUploadFileResponse = {
  result: boolean;
  item: Record<string, unknown>;
};

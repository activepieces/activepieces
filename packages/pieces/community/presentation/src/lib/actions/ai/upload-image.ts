import FormData from 'form-data';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationUploadImageOutputSchema } from '../../output-schemas';

export const uploadImage = createAction({
  auth: presentonAuth,
  name: 'presentation_upload_image',
  outputSchema: presentationUploadImageOutputSchema,
  displayName: 'Upload Image',
  description: 'Upload an image to the Presenton image library.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads one image and returns its id, path and url. Each call stores a new copy, so it is not idempotent. Remove it later with presentation_delete_image.',
    idempotent: false,
  },
  props: {
    file: Property.File({ displayName: 'Image', required: true }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('file', propsValue.file.data, propsValue.file.filename);
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v3/images/upload',
      body: form,
      headers: form.getHeaders(),
    });
  },
});

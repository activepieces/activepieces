import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationDeleteImageOutputSchema } from '../../output-schemas';

export const deleteImage = createAction({
  auth: presentonAuth,
  name: 'presentation_delete_image',
  outputSchema: presentationDeleteImageOutputSchema,
  displayName: 'Delete Image',
  description: 'Permanently delete an uploaded image.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an uploaded image by id; this cannot be undone. Get the id from presentation_list_images or presentation_upload_image.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({ displayName: 'Image ID', required: true }),
  },
  async run({ auth, propsValue }) {
    await presentonClient.request<unknown>({
      auth: auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/api/v3/images/${encodeURIComponent(propsValue.id)}`,
    });
    return { success: true, id: propsValue.id };
  },
});

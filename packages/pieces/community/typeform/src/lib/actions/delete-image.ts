import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon } from '../common';
import { deleteImageOutputSchema } from '../output-schemas';

export const deleteImageAction = createAction({
  auth: typeformAuth,
  name: 'delete_image',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Image',
  description: 'Deletes an image from the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete an image from the Typeform account by ID. Forms and themes that use it may show it missing. Cannot be undone; confirm with the user first.',
    idempotent: false,
  },
  outputSchema: deleteImageOutputSchema,
  props: {
    imageId: Property.ShortText({
      displayName: 'Image ID',
      description: 'Image ID, from List Images.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const imageId = propsValue.imageId.trim();
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.DELETE,
      path: `/images/${encodeURIComponent(imageId)}`,
    });
    return { deleted: true, image_id: imageId };
  },
});

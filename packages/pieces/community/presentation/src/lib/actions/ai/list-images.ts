import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationListImagesOutputSchema } from '../../output-schemas';

export const listImages = createAction({
  auth: presentonAuth,
  name: 'presentation_list_images',
  outputSchema: presentationListImagesOutputSchema,
  displayName: 'List Images',
  description: 'List images uploaded to the Presenton image library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists uploaded images with their ids and urls. Get the id for presentation_delete_image here.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const images = await presentonClient.request<unknown>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/v3/images/uploaded',
    });
    const items = Array.isArray(images) ? images : [];
    return { count: items.length, images: items };
  },
});

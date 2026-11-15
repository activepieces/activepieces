import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { imagesOutputSchema } from '../output-schemas';

export const listImagesAction = createAction({
  auth: typeformAuth,
  name: 'list_images',
  classification: 'SEARCH',
  displayName: 'List Images',
  description: 'Lists images uploaded to the Typeform account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List images uploaded to the Typeform account, newest first, with each ID, file name and link. Typeform returns them all at once; Limit caps how many are returned. Read-only.',
    idempotent: true,
  },
  outputSchema: imagesOutputSchema,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of images to return. Default 50.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const images = await typeformCommon.typeformRequest<TypeformRecord[]>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: '/images',
    });
    const limit = Math.max(1, Math.floor(propsValue.limit ?? 50));
    const items = images.slice(0, limit);
    return { items, count: items.length, total_items: images.length };
  },
});

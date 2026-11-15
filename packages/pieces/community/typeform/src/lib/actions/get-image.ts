import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { imageOutputSchema } from '../output-schemas';

export const getImageAction = createAction({
  auth: typeformAuth,
  name: 'get_image',
  classification: 'READ',
  displayName: 'Get Image',
  description: 'Gets an image with its link and details.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Typeform image by ID with its file name, media type, width, height and link (src). Read-only.',
    idempotent: true,
  },
  outputSchema: imageOutputSchema,
  props: {
    imageId: Property.ShortText({
      displayName: 'Image ID',
      description: 'Image ID, from List Images.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: `/images/${encodeURIComponent(propsValue.imageId.trim())}`,
      headers: { Accept: 'application/json' },
    });
  },
});

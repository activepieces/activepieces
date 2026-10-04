import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryDeleteMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteTransformation = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_transformation',
  outputSchema: cloudinaryDeleteMetadataFieldOutputSchema,
  displayName: 'Delete Named Transformation',
  description: 'Deletes a named transformation.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Deletes a named transformation; URLs using t_<name> stop generating new derived assets. Optionally invalidates already-derived copies on the CDN.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Transformation Name',
      description: 'Named transformation name, without the t_ prefix.',
      required: true,
    }),
    invalidate: aiProps.invalidate(),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.DELETE, `/transformations/${encodeURIComponent(propsValue.name.trim())}`, undefined, { invalidate: propsValue.invalidate || undefined });
  },
});

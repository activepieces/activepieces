import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryDeleteMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateTransformation = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_transformation',
  outputSchema: cloudinaryDeleteMetadataFieldOutputSchema,
  displayName: 'Update Named Transformation',
  description: 'Changes a named transformation\'s definition or strict-mode flag.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the definition of an existing named transformation and/or its allowed-for-strict flag; omitted settings stay unchanged. Already-generated derived assets keep the old result until invalidated.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Transformation Name',
      description: 'Named transformation name, without the t_ prefix.',
      required: true,
    }),
    transformation: Property.ShortText({ displayName: 'New Transformation', description: 'New transformation string.', required: false }),
    allowed_for_strict: aiProps.optionalBoolean({ displayName: 'Allowed for Strict Mode', description: 'Allow this transformation when strict transformations are enabled.' }),
  },
  async run({ auth, propsValue }) {
    const allowedForStrict = aiResults.toBoolean({ value: propsValue.allowed_for_strict });
    const body = {
      ...(propsValue.transformation ? { unsafe_update: propsValue.transformation.trim() } : {}),
      ...(allowedForStrict !== undefined ? { allowed_for_strict: allowedForStrict } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Provide a new transformation or strict-mode setting.');
    }
    return makeRequest(auth, HttpMethod.PUT, `/transformations/${encodeURIComponent(propsValue.name.trim())}`, body);
  },
});

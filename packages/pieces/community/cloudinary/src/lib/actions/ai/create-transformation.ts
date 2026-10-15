import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryDeleteMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryCreateTransformation = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_create_transformation',
  outputSchema: cloudinaryDeleteMetadataFieldOutputSchema,
  displayName: 'Create Named Transformation',
  description: 'Saves a transformation under a reusable name.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a named transformation, so delivery URLs can use t_<name> instead of the full parameter string (e.g. name "thumb" for "c_fill,w_200,h_200/f_auto,q_auto"). Fails if the name exists; use Update Named Transformation to change it.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Transformation Name',
      description: 'Named transformation name, without the t_ prefix.',
      required: true,
    }),
    transformation: Property.ShortText({ displayName: 'Transformation', description: 'Transformation string (e.g. "c_fill,w_200,h_200/f_auto,q_auto").', required: true }),
    allowed_for_strict: aiProps.includeFlag({ displayName: 'Allowed for Strict Mode', description: 'Allow this transformation when strict transformations are enabled.' }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.POST, `/transformations/${encodeURIComponent(propsValue.name.trim())}`, {
      transformation: propsValue.transformation.trim(),
      ...(propsValue.allowed_for_strict ? { allowed_for_strict: true } : {}),
    });
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryGetTransformationOutputSchema } from '../../output-schemas';

export const cloudinaryGetTransformation = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_transformation',
  outputSchema: cloudinaryGetTransformationOutputSchema,
  displayName: 'Get Transformation',
  description: 'Gets a transformation\'s definition and the assets derived with it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one transformation (by name, or by its transformation string such as "c_fill,w_200"), including whether it is named, allowed in strict mode, its parameters, and derived assets that use it.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Transformation',
      description: 'A named transformation name, or a transformation string (e.g. "c_fill,w_200").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.GET, `/transformations/${encodeURIComponent(propsValue.name.trim())}`);
  },
});

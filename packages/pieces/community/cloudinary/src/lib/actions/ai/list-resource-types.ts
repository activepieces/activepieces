import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryListResourceTypesOutputSchema } from '../../output-schemas';

export const cloudinaryListResourceTypes = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resource_types',
  outputSchema: cloudinaryListResourceTypesOutputSchema,
  displayName: 'List Resource Types',
  description: 'Lists the resource types (image, video, raw) that exist in the product environment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns which resource types (image, video, raw) currently hold assets in this Cloudinary product environment. Use before listing or searching to know which resource_type values are worth querying.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response: { resource_types: string[] } = await makeRequest(auth, HttpMethod.GET, '/resources');
    return { resource_types: response.resource_types, count: response.resource_types.length };
  },
});

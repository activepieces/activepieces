import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListTransformationsOutputSchema } from '../../output-schemas';

export const cloudinaryListTransformations = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_transformations',
  outputSchema: cloudinaryListTransformationsOutputSchema,
  displayName: 'List Transformations',
  description: 'Lists transformations used in the account, optionally only named ones.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists transformations (name, named flag, used flag, allowed_for_strict) generated or defined in the account. Set Named Only to list reusable named transformations, which deliver as t_<name> in URLs. Pages with next_cursor.',
    idempotent: true,
  },
  props: {
    named: aiProps.optionalBoolean({ displayName: 'Named Only', description: 'Yes for named transformations only, No for unnamed only.' }),
    max_results: aiProps.maxResults(),
    next_cursor: aiProps.nextCursor(),
  },
  async run({ auth, propsValue }) {
    const response: { transformations: Record<string, unknown>[]; next_cursor?: string } = await makeRequest(auth, HttpMethod.GET, '/transformations', undefined, {
      named: aiResults.toBoolean({ value: propsValue.named }),
      max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
      next_cursor: propsValue.next_cursor,
    });
    return { transformations: response.transformations, count: response.transformations.length, next_cursor: response.next_cursor ?? null };
  },
});

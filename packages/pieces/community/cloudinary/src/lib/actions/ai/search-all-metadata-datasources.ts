import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinarySearchAllMetadataDatasourcesOutputSchema } from '../../output-schemas';

export const cloudinarySearchAllMetadataDatasources = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_search_all_metadata_datasources',
  outputSchema: cloudinarySearchAllMetadataDatasourcesOutputSchema,
  displayName: 'Search All Metadata Values',
  description: 'Searches allowed values across every enum and set metadata field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches allowed values across all enum and set metadata fields, returning field_id, value id and value for each match. Use when you know a value (e.g. a color) but not which field holds it.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({ displayName: 'Search Term', description: 'Text to match in the values.', required: true }),
    max_results: Property.Number({ displayName: 'Max Results', description: 'Maximum values to return.', required: false }),
  },
  async run({ auth, propsValue }) {
    const max = aiResults.clampMaxResults({ value: propsValue.max_results });
    const response: Record<string, unknown>[] = await makeRequest(auth, HttpMethod.POST, '/metadata_fields/datasource/search', {
      term: propsValue.term,
      ...(max !== undefined ? { max_results: max } : {}),
    });
    return { values: response, count: response.length };
  },
});

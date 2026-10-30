import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryDeleteMetadataDatasourceEntriesOutputSchema } from '../../output-schemas';

export const cloudinarySearchMetadataFieldDatasource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_search_metadata_field_datasource',
  outputSchema: cloudinaryDeleteMetadataDatasourceEntriesOutputSchema,
  displayName: 'Search Metadata Field Values',
  description: 'Searches the allowed values of one enum or set metadata field.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the allowed values of one enum or set metadata field by text, returning matching values with their external_ids (needed to set the field on assets). To search across every field use Search All Metadata Values.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    term: Property.ShortText({ displayName: 'Search Term', description: 'Text to match in the values.', required: true }),
    exact_match: Property.Checkbox({ displayName: 'Exact Match', description: 'Only return values equal to the term.', required: false, defaultValue: false }),
    max_results: Property.Number({ displayName: 'Max Results', description: 'Maximum values to return.', required: false }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.POST, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/datasource/search`, {}, {
      term: propsValue.term,
      exact_match: propsValue.exact_match || undefined,
      max_results: aiResults.clampMaxResults({ value: propsValue.max_results }),
    });
  },
});

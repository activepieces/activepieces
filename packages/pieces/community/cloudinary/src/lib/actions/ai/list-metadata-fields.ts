import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryListMetadataFieldsOutputSchema } from '../../output-schemas';

export const cloudinaryListMetadataFields = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_metadata_fields',
  outputSchema: cloudinaryListMetadataFieldsOutputSchema,
  displayName: 'List Metadata Fields',
  description: 'Lists the structured metadata field definitions.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all structured metadata fields (type, external_id, label, mandatory, default, validation, datasource values), or only the given external_ids. Use to find the field and value external_ids that Update Resource Metadata and Search Assets (metadata.<id>) need.',
    idempotent: true,
  },
  props: {
    external_ids: Property.Array({ displayName: 'External IDs', description: 'Only return these fields. Leave empty for all.', required: false }),
  },
  async run({ auth, propsValue }) {
    const externalIds = aiResults.cleanArray({ values: propsValue.external_ids });
    const response: { metadata_fields: Record<string, unknown>[] } = await makeRequest(auth, HttpMethod.GET, '/metadata_fields', undefined, {
      external_ids: externalIds.length > 0 ? externalIds : undefined,
    });
    return { metadata_fields: response.metadata_fields, count: response.metadata_fields.length };
  },
});

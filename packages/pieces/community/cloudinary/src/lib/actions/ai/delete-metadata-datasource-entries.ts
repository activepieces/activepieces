import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryDeleteMetadataDatasourceEntriesOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteMetadataDatasourceEntries = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_metadata_datasource_entries',
  outputSchema: cloudinaryDeleteMetadataDatasourceEntriesOutputSchema,
  displayName: 'Delete Metadata Datasource Values',
  description: 'Disables allowed values of an enum or set metadata field.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Soft-deletes allowed values of an enum or set metadata field by value external_id; they disappear from the field and can be brought back with Restore Metadata Datasource Values. Returns the remaining values.',
    idempotent: false,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    value_external_ids: Property.Array({
      displayName: 'Value External IDs',
      description: 'external_ids of the datasource values, from Get Metadata Field.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const externalIds = aiResults.requireItems({ values: propsValue.value_external_ids, label: 'value external IDs', max: 1000 });
    return makeRequest(auth, HttpMethod.DELETE, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/datasource`, { external_ids: externalIds });
  },
});

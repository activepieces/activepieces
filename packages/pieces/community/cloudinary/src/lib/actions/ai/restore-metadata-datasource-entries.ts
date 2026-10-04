import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryDeleteMetadataDatasourceEntriesOutputSchema } from '../../output-schemas';

export const cloudinaryRestoreMetadataDatasourceEntries = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_restore_metadata_datasource_entries',
  outputSchema: cloudinaryDeleteMetadataDatasourceEntriesOutputSchema,
  displayName: 'Restore Metadata Datasource Values',
  description: 'Restores previously deleted allowed values of a metadata field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores allowed values of an enum or set metadata field that were removed with Delete Metadata Datasource Values, by value external_id. Returns the active values.',
    idempotent: true,
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
    return makeRequest(auth, HttpMethod.POST, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/datasource_restore`, { external_ids: externalIds });
  },
});

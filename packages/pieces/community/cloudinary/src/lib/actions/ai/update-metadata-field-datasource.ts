import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryDeleteMetadataDatasourceEntriesOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateMetadataFieldDatasource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_metadata_field_datasource',
  outputSchema: cloudinaryDeleteMetadataDatasourceEntriesOutputSchema,
  displayName: 'Update Metadata Field Datasource',
  description: 'Adds or renames allowed values of an enum or set metadata field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts allowed values of an enum or set metadata field: a value with an existing external_id is renamed, a value with a new external_id is added; an empty external_id defaults to the value itself, so repeating the call does not create duplicates. Existing values not listed are kept. Returns the full value list.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    values: Property.Array({
      displayName: 'Values',
      description: 'Values to add or update.',
      required: true,
      properties: {
        value: Property.ShortText({ displayName: 'Value', description: 'The display value.', required: true }),
        external_id: Property.ShortText({ displayName: 'Value External ID', description: 'Existing external_id to rename, or a new ID. Defaults to the value itself when empty.', required: false }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const values = (propsValue.values ?? []).flatMap((item) => {
      if (typeof item !== 'object' || item === null || !('value' in item) || typeof item.value !== 'string' || item.value.trim() === '') {
        return [];
      }
      const externalId = 'external_id' in item && typeof item.external_id === 'string' ? item.external_id.trim() : '';
      return [{ value: item.value, external_id: externalId || item.value }];
    });
    if (values.length === 0) {
      throw new Error('Provide at least one value.');
    }
    return makeRequest(auth, HttpMethod.PUT, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/datasource`, { values });
  },
});

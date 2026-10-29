import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryDeleteMetadataDatasourceEntriesOutputSchema } from '../../output-schemas';

export const cloudinaryOrderMetadataDatasource = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_order_metadata_datasource',
  outputSchema: cloudinaryDeleteMetadataDatasourceEntriesOutputSchema,
  displayName: 'Sort Metadata Field Values',
  description: 'Sorts the allowed values of an enum or set metadata field.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sorts the allowed values of an enum or set metadata field alphabetically by value, ascending or descending. Returns the reordered values.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Sort direction.',
      required: true,
      defaultValue: 'asc',
      options: { options: [{ label: 'A to Z', value: 'asc' }, { label: 'Z to A', value: 'desc' }] },
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.POST, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/datasource/order`, { order_by: 'value', direction: propsValue.direction });
  },
});

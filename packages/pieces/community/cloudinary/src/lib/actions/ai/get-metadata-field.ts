import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryGetMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryGetMetadataField = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_metadata_field',
  outputSchema: cloudinaryGetMetadataFieldOutputSchema,
  displayName: 'Get Metadata Field',
  description: 'Gets one structured metadata field definition.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one structured metadata field definition by external_id, including its datasource values for enum and set fields.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.GET, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}`);
  },
});

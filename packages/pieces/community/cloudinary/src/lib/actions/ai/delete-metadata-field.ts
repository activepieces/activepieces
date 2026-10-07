import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryDeleteMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteMetadataField = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_metadata_field',
  outputSchema: cloudinaryDeleteMetadataFieldOutputSchema,
  displayName: 'Delete Metadata Field',
  description: 'Deletes a structured metadata field and its values on all assets.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a structured metadata field definition by external_id, removing its values from every asset. Irreversible.',
    idempotent: false,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.DELETE, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}`);
  },
});

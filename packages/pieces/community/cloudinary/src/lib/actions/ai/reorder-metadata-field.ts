import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryReorderMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryReorderMetadataField = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_reorder_metadata_field',
  outputSchema: cloudinaryReorderMetadataFieldOutputSchema,
  displayName: 'Move Metadata Field',
  description: 'Moves one metadata field to a position in the field list.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Moves one metadata field to a 1-based position in the field order shown in the Media Library. To sort all fields at once use Sort Metadata Fields. Returns the full ordered list.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'Field External ID',
      description: 'The metadata field external_id, from List Metadata Fields.',
      required: true,
    }),
    position: Property.Number({ displayName: 'Position', description: 'New 1-based position.', required: true }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.PUT, `/metadata_fields/${encodeURIComponent(propsValue.external_id.trim())}/reorder`, { position: propsValue.position });
  },
});

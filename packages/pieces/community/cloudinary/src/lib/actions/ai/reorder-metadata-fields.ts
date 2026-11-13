import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryReorderMetadataFieldOutputSchema } from '../../output-schemas';

export const cloudinaryReorderMetadataFields = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_reorder_metadata_fields',
  outputSchema: cloudinaryReorderMetadataFieldOutputSchema,
  displayName: 'Sort Metadata Fields',
  description: 'Sorts all metadata fields by label, creation date or external ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Sorts the whole metadata field list by label, created_at or external_id. Returns the ordered list. To move a single field use Move Metadata Field.',
    idempotent: true,
  },
  props: {
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort key.',
      required: true,
      defaultValue: 'label',
      options: { options: ['label', 'created_at', 'external_id'].map((value) => ({ label: value, value })) },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Defaults to ascending.',
      required: false,
      options: { options: [{ label: 'Ascending', value: 'asc' }, { label: 'Descending', value: 'desc' }] },
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.PUT, '/metadata_fields/order', {
      order_by: propsValue.order_by,
      ...(propsValue.direction ? { direction: propsValue.direction } : {}),
    });
  },
});

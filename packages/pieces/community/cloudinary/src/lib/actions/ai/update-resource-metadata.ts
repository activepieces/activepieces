import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryUpdateResourceContextOutputSchema } from '../../output-schemas';

export const cloudinaryUpdateResourceMetadata = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_update_resource_metadata',
  outputSchema: cloudinaryUpdateResourceContextOutputSchema,
  displayName: 'Update Resource Metadata',
  description: 'Sets structured metadata field values on multiple assets.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets structured metadata values on up to 100 assets, keyed by metadata field external_id (List Metadata Fields returns them). Enum and set fields take datasource value external_ids, set fields an array of them. Fields not given are unchanged; an empty string clears a field.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_ids: Property.Array({
      displayName: 'Public IDs',
      description: 'Public IDs of the assets to update (up to 100).',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Field external_id to value, e.g. {"sku": "A-100", "color": ["red_id"]}.',
      required: true,
    }),
    clear_invalid: aiProps.includeFlag({ displayName: 'Clear Invalid Values', description: 'Drop existing values that no longer pass field validation instead of failing.' }),
  },
  async run({ auth, propsValue }) {
    const publicIds = aiResults.requireItems({ values: propsValue.public_ids, label: 'public IDs', max: 100 });
    if (Object.keys(propsValue.metadata).length === 0) {
      throw new Error('Provide at least one metadata field value.');
    }
    return makeRequest(auth, HttpMethod.POST, `/${propsValue.resource_type}/metadata`, {
      public_ids: publicIds,
      type: propsValue.type ?? 'upload',
      metadata: propsValue.metadata,
      ...(propsValue.clear_invalid ? { clear_invalid: true } : {}),
    });
  },
});

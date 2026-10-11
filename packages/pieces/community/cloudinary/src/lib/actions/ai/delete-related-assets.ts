import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryAddRelatedAssetsOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteRelatedAssets = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_related_assets',
  outputSchema: cloudinaryAddRelatedAssetsOutputSchema,
  displayName: 'Remove Related Assets',
  description: 'Removes relations between a source asset and up to 10 assets, by public ID.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the relations between a source asset (by public ID) and up to 10 related assets, given as "resource_type/type/public_id" paths. The assets themselves are not deleted. Returns success and failed lists.',
    idempotent: false,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_id: Property.ShortText({ displayName: 'Public ID', description: 'Public ID of the source asset.', required: true }),
    assets_to_unrelate: Property.Array({
      displayName: 'Assets to Unrelate',
      description: 'Up to 10 asset paths as resource_type/type/public_id.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const items = aiResults.requireItems({ values: propsValue.assets_to_unrelate, label: 'related assets', max: 10 });
    return makeRequest(auth, HttpMethod.DELETE, `/resources/related_assets/${propsValue.resource_type}/${propsValue.type ?? 'upload'}/${aiResults.encodePath({ value: propsValue.public_id })}`, { assets_to_unrelate: items });
  },
});

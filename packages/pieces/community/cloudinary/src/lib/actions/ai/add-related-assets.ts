import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryAddRelatedAssetsOutputSchema } from '../../output-schemas';

export const cloudinaryAddRelatedAssets = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_add_related_assets',
  outputSchema: cloudinaryAddRelatedAssetsOutputSchema,
  displayName: 'Add Related Assets',
  description: 'Links up to 10 assets to a source asset by public ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates two-way relations between a source asset (by public ID) and up to 10 other assets, given as "resource_type/type/public_id" paths (e.g. "image/upload/shoe-side"). Relations show in Get Resource as related_assets. Returns success and failed lists; re-adding an existing relation is reported, not duplicated.',
    idempotent: true,
  },
  props: {
    resource_type: aiProps.resourceType({ required: true }),
    type: aiProps.deliveryType(),
    public_id: Property.ShortText({ displayName: 'Public ID', description: 'Public ID of the source asset.', required: true }),
    assets_to_relate: Property.Array({
      displayName: 'Assets to Relate',
      description: 'Up to 10 asset paths as resource_type/type/public_id (e.g. "image/upload/shoe-side").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const items = aiResults.requireItems({ values: propsValue.assets_to_relate, label: 'related assets', max: 10 });
    return makeRequest(auth, HttpMethod.POST, `/resources/related_assets/${propsValue.resource_type}/${propsValue.type ?? 'upload'}/${aiResults.encodePath({ value: propsValue.public_id })}`, { assets_to_relate: items });
  },
});

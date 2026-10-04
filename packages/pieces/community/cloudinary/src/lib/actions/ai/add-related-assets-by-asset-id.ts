import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryAddRelatedAssetsOutputSchema } from '../../output-schemas';

export const cloudinaryAddRelatedAssetsByAssetId = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_add_related_assets_by_asset_id',
  outputSchema: cloudinaryAddRelatedAssetsOutputSchema,
  displayName: 'Add Related Assets by Asset ID',
  description: 'Links up to 10 assets to a source asset, all identified by asset ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates two-way relations between a source asset and up to 10 other assets, all identified by their immutable asset_id. Use Add Related Assets when you have public IDs. Returns success and failed lists.',
    idempotent: true,
  },
  props: {
    asset_id: Property.ShortText({ displayName: 'Asset ID', description: 'asset_id of the source asset.', required: true }),
    assets_to_relate: Property.Array({
      displayName: 'Asset IDs to Relate',
      description: 'Up to 10 asset_ids.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const items = aiResults.requireItems({ values: propsValue.assets_to_relate, label: 'related assets', max: 10 });
    return makeRequest(auth, HttpMethod.POST, `/resources/related_assets/${encodeURIComponent(propsValue.asset_id.trim())}`, { assets_to_relate: items });
  },
});

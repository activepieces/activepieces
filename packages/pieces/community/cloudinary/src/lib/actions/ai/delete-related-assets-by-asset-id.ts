import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryAddRelatedAssetsOutputSchema } from '../../output-schemas';

export const cloudinaryDeleteRelatedAssetsByAssetId = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_delete_related_assets_by_asset_id',
  outputSchema: cloudinaryAddRelatedAssetsOutputSchema,
  displayName: 'Remove Related Assets by Asset ID',
  description: 'Removes relations between a source asset and up to 10 assets, by asset ID.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the relations between a source asset and up to 10 related assets, all identified by asset_id. The assets themselves are not deleted. Returns success and failed lists.',
    idempotent: false,
  },
  props: {
    asset_id: Property.ShortText({ displayName: 'Asset ID', description: 'asset_id of the source asset.', required: true }),
    assets_to_unrelate: Property.Array({
      displayName: 'Asset IDs to Unrelate',
      description: 'Up to 10 asset_ids.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const items = aiResults.requireItems({ values: propsValue.assets_to_unrelate, label: 'related assets', max: 10 });
    return makeRequest(auth, HttpMethod.DELETE, `/resources/related_assets/${encodeURIComponent(propsValue.asset_id.trim())}`, { assets_to_unrelate: items });
  },
});

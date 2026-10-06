import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest, ResourceList } from '../../common/client';
import { aiProps, aiResults } from '../../common/ai-props';
import { cloudinaryListResourcesByAssetIdsOutputSchema } from '../../output-schemas';

export const cloudinaryListResourcesByAssetIds = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_list_resources_by_asset_ids',
  outputSchema: cloudinaryListResourcesByAssetIdsOutputSchema,
  displayName: 'List Resources by Asset IDs',
  description: 'Fetches several assets at once by their immutable asset IDs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Fetches up to 100 assets in one call by their asset IDs (the immutable 32-character asset_id returned by upload, list and search). Use for a known set of IDs; for a single asset with full details use Get Resource by Asset ID.',
    idempotent: true,
  },
  props: {
    asset_ids: Property.Array({
      displayName: 'Asset IDs',
      description: 'Up to 100 asset IDs.',
      required: true,
    }),
    resource_type: aiProps.resourceType({ required: false }),
  },
  async run({ auth, propsValue }) {
    const assetIds = aiResults.cleanArray({ values: propsValue.asset_ids });
    if (assetIds.length === 0 || assetIds.length > 100) {
      throw new Error('Provide between 1 and 100 asset IDs.');
    }
    const response: ResourceList = await makeRequest(auth, HttpMethod.GET, '/resources/by_asset_ids', undefined, { asset_ids: assetIds, resource_type: propsValue.resource_type });
    return aiResults.toResourceList({ response });
  },
});

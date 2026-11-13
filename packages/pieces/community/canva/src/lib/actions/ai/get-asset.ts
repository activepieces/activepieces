import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AssetResponse, canvaAuth } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetAssetAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_asset',
  displayName: 'Get Asset',
  description: 'Gets one Canva library asset by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.aiAsset,
  aiMetadata: {
    description:
      'Returns one image or video from the Canva library: name, type, tags, timestamps and thumbnail. Needs the asset ID (from canva_list_folder_items or canva_upload_asset_from_url). Assets are media, not designs; use canva_get_design for designs.',
    idempotent: true,
  },
  props: {
    assetId: Property.ShortText({ displayName: 'Asset ID', description: 'The Canva asset ID.', required: true }),
  },
  async run(context) {
    const assetId = context.propsValue.assetId.trim();
    if (!assetId) {
      throw new Error('Asset ID is required.');
    }
    const body = await canvaClient.request<AssetResponse>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/assets/${encodeURIComponent(assetId)}`,
    });
    return { asset: body.asset };
  },
});

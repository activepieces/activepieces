import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaDeleteAssetAi = createAction({
  auth: canvaAuth,
  name: 'canva_delete_asset',
  displayName: 'Delete Asset',
  description: 'Deletes an image or video from the Canva library.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: canvaOutputSchemas.aiDeleteAsset,
  aiMetadata: {
    description:
      "Deletes one image or video from the user's Canva library by asset ID (moves it to Canva's trash). Only use when the user clearly asked to delete that asset; confirm the ID with canva_get_asset first. Not idempotent: a second call for the same ID fails with not found.",
    idempotent: false,
  },
  props: {
    assetId: Property.ShortText({ displayName: 'Asset ID', description: 'The Canva asset ID to delete.', required: true }),
  },
  async run(context) {
    const assetId = context.propsValue.assetId.trim();
    if (!assetId) {
      throw new Error('Asset ID is required.');
    }
    await canvaClient.request<unknown>({
      token: context.auth.access_token,
      method: HttpMethod.DELETE,
      path: `/assets/${encodeURIComponent(assetId)}`,
    });
    return { deleted: true, asset_id: assetId };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AssetResponse, canvaAuth, canvaProps } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  classification: 'READ',
  displayName: 'Get Asset',
  description: 'Get the details of an image or video in your Canva library, including name, tags, dates and thumbnail.',
  audience: 'human',
  aiMetadata: {
    description: 'Gets one Canva library asset by ID. Human step; agents use canva_get_asset. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.getAsset,
  props: {
    asset_id: canvaProps.assetDropdown({ displayName: 'Asset', description: 'The asset to look up.', required: true }),
  },
  async run(context) {
    const assetId = (context.propsValue.asset_id ?? '').trim();
    if (!assetId) {
      throw new Error('Asset is required.');
    }
    const { asset } = await canvaClient.request<AssetResponse>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/assets/${encodeURIComponent(assetId)}`,
    });
    const tags = asset.tags ?? [];
    return {
      asset: {
        type: asset.type,
        id: asset.id,
        name: asset.name,
        tags,
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        thumbnail: asset.thumbnail ?? null,
        import_status: asset.import_status ?? null,
      },
      asset_id: asset.id,
      asset_name: asset.name,
      asset_type: asset.type,
      tags_count: tags.length,
      tags_list: tags.join(', '),
      created_date: new Date(asset.created_at * 1000).toISOString(),
      updated_date: new Date(asset.updated_at * 1000).toISOString(),
      has_thumbnail: Boolean(asset.thumbnail),
      thumbnail_url: asset.thumbnail?.url ?? null,
      thumbnail_dimensions: asset.thumbnail ? `${asset.thumbnail.width}x${asset.thumbnail.height}` : null,
      is_imported_successfully: !asset.import_status || asset.import_status.state === 'success',
      import_status_state: asset.import_status?.state ?? 'success',
      import_error_message: asset.import_status?.error?.message ?? null,
    };
  },
});

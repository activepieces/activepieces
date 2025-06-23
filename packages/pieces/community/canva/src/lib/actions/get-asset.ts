import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon, AssetResponse, fetchUserAssets } from '../common';

export const getAsset = createAction({
  auth: canvaAuth,
  name: 'get_asset',
  displayName: 'Get Asset',
  description: 'Retrieve metadata for a specific asset (image or video), including name, tags, creation date, and thumbnail.',
  props: {
    asset_id: Property.Dropdown({
      displayName: 'Asset',
      description: 'Select the asset to retrieve metadata for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        try {
          const assets = await fetchUserAssets(auth);
          return {
            disabled: false,
            options: assets,
          };
        } catch (error) {
          console.error('Error fetching assets:', error);
          return {
            disabled: true,
            placeholder: 'Error loading assets',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { asset_id } = context.propsValue;
    const authValue = context.auth as OAuth2PropertyValue;

    if (!asset_id || !asset_id.trim()) {
      throw new Error('Asset ID is required');
    }

    const cleanAssetId = asset_id.trim();

    try {
      const response = await fetch(`${canvaCommon.baseUrl}/assets/${cleanAssetId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authValue.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorData.message || 'Invalid asset ID format'}`);
        }
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Please check your authentication credentials');
        }
        
        if (response.status === 403) {
          throw new Error('Forbidden: You do not have permission to access this asset');
        }
        
        if (response.status === 404) {
          throw new Error(`Asset not found: The asset with ID "${cleanAssetId}" does not exist or you do not have access to it`);
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests (limit: 100 per minute)');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
      }

      const data: AssetResponse = await response.json();
      const asset = data.asset;

      return {
        asset: {
          type: asset.type,
          id: asset.id,
          name: asset.name,
          tags: asset.tags,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          thumbnail: asset.thumbnail || null,
          import_status: asset.import_status || null,
        },
        asset_id: asset.id,
        asset_name: asset.name,
        asset_type: asset.type,
        tags_count: asset.tags.length,
        tags_list: asset.tags.join(', '),
        created_date: new Date(asset.created_at * 1000).toISOString(),
        updated_date: new Date(asset.updated_at * 1000).toISOString(),
        has_thumbnail: !!asset.thumbnail,
        thumbnail_url: asset.thumbnail?.url || null,
        thumbnail_dimensions: asset.thumbnail 
          ? `${asset.thumbnail.width}x${asset.thumbnail.height}` 
          : null,
        is_imported_successfully: !asset.import_status || asset.import_status.state === 'success',
        import_status_state: asset.import_status?.state || 'success',
        import_error_message: asset.import_status?.error?.message || null,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to get asset: ${String(error)}`);
    }
  },
}); 
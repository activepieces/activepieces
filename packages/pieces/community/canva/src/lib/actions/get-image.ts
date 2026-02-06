import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon, AssetResponse, fetchUserAssets } from '../common';

export const getImage = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get Image',
  description:
    'Retrieve metadata for an image in your Canva library, including name, tags, creation date, and thumbnail.',
  props: {
    image_id: Property.Dropdown({
      displayName: 'Image',
      description: 'Select the image to retrieve metadata for',
      required: true,
      auth: canvaAuth,
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
    const { image_id } = context.propsValue;
    const authValue = context.auth as OAuth2PropertyValue;

    if (!image_id || !image_id.trim()) {
      throw new Error('Image ID is required');
    }

    const cleanImageId = image_id.trim();

    try {
      const response = await fetch(`${canvaCommon.baseUrl}/assets/${cleanImageId}`, {
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
          throw new Error(
            `Image not found: The image with ID "${cleanImageId}" does not exist or you do not have access to it`
          );
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests (limit: 100 per minute)');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
      }

      const data: AssetResponse = await response.json();
      const image = data.asset;

      return {
        image: {
          type: image.type,
          id: image.id,
          name: image.name,
          tags: image.tags,
          created_at: image.created_at,
          updated_at: image.updated_at,
          thumbnail: image.thumbnail || null,
          import_status: image.import_status || null,
        },
        image_id: image.id,
        image_name: image.name,
        image_type: image.type,
        tags_count: image.tags.length,
        tags_list: image.tags.join(', '),
        created_date: new Date(image.created_at * 1000).toISOString(),
        updated_date: new Date(image.updated_at * 1000).toISOString(),
        has_thumbnail: !!image.thumbnail,
        thumbnail_url: image.thumbnail?.url || null,
        thumbnail_dimensions: image.thumbnail 
          ? `${image.thumbnail.width}x${image.thumbnail.height}` 
          : null,
        is_imported_successfully:
          !image.import_status || image.import_status.state === 'success',
        import_status_state: image.import_status?.state || 'success',
        import_error_message: image.import_status?.error?.message || null,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to get asset: ${String(error)}`);
    }
  },
}); 

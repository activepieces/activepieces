import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const getImage = createAction({
  auth: canvaAuth,
  name: 'get_image',
  displayName: 'Get Image',
  description: 'Retrieve details about a specific image asset',
  props: {
    imageId: Property.ShortText({
      displayName: 'Image ID',
      description: 'ID of the image to retrieve',
      required: true,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Include detailed metadata about the image',
      required: false,
      defaultValue: true,
    }),
    includeThumbnails: Property.Checkbox({
      displayName: 'Include Thumbnails',
      description: 'Include thumbnail URLs in different sizes',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { imageId, includeMetadata, includeThumbnails } = context.propsValue;
    
    try {
      const params = new URLSearchParams();
      if (includeMetadata) params.append('include_metadata', 'true');
      if (includeThumbnails) params.append('include_thumbnails', 'true');

      const result = await canvaCommon.makeRequest(
        context.auth,
        'GET',
        `/assets/${imageId}?${params.toString()}`
      );

      return {
        success: true,
        image: result.asset,
        name: result.asset.name,
        url: result.asset.url,
        thumbnails: result.asset.thumbnails || {},
        metadata: result.asset.metadata || {},
        tags: result.asset.tags || [],
        createdAt: result.asset.created_at,
        updatedAt: result.asset.updated_at,
        message: `Retrieved image "${result.asset.name}" successfully`,
      };
    } catch (error:any) {
      throw new Error(`Failed to get image: ${error.message}`);
    }
  },
});
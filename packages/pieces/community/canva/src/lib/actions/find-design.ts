import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const findDesign = createAction({
  auth: canvaAuth,
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for designs by name, type, or other criteria',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find designs',
      required: false,
    }),
    designType: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Filter by design type',
      required: false,
      options: {
        options: [
          { label: 'All Types', value: '' },
          { label: 'Instagram Post', value: 'instagram-post' },
          { label: 'Instagram Story', value: 'instagram-story' },
          { label: 'Facebook Post', value: 'facebook-post' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Poster', value: 'poster' },
          { label: 'Flyer', value: 'flyer' },
          { label: 'Business Card', value: 'business-card' },
          { label: 'Logo', value: 'logo' },
        ],
      },
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Search within a specific folder',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 20,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort results by',
      required: false,
      options: {
        options: [
          { label: 'Modified Date (Newest)', value: 'modified_desc' },
          { label: 'Modified Date (Oldest)', value: 'modified_asc' },
          { label: 'Created Date (Newest)', value: 'created_desc' },
          { label: 'Created Date (Oldest)', value: 'created_asc' },
          { label: 'Title (A-Z)', value: 'title_asc' },
          { label: 'Title (Z-A)', value: 'title_desc' },
        ],
      },
      defaultValue: 'modified_desc',
    }),
  },
  async run(context) {
    const { query, designType, folderId, limit, sortBy } = context.propsValue;
    
    try {
      const params = new URLSearchParams();
      
      if (query) params.append('query', query);
      if (designType) params.append('design_type', designType);
      if (folderId) params.append('folder_id', folderId);
      if (limit) params.append('limit', limit.toString());
      if (sortBy) params.append('sort_by', sortBy);

      const result = await canvaCommon.makeRequest(
        context.auth,
        'GET',
        `/designs/search?${params.toString()}`
      );

      return {
        success: true,
        designs: result.designs,
        totalCount: result.total_count,
        hasMore: result.has_more,
        message: `Found ${result.designs.length} design(s)`,
      };
    } catch (error:any) {
      throw new Error(`Failed to search designs: ${error.message}`);
    }
  },
});
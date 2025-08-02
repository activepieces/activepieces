import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSpace = createAction({
  auth: paperformAuth,
  name: 'findSpace',
  displayName: 'Find Space',
  description: 'Retrieve space details by name or ID.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Spaces',
      description: 'Search spaces by name (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search } = propsValue;
    
    try {
      const response = await paperformCommon.getSpaces({
        auth: auth as string,
        search: search as string,
        limit: 100,
      });
      
      return {
        success: true,
        message: `Found ${response.results.spaces.length} space(s)${search ? ` matching "${search}"` : ''}.`,
        spaces: response.results.spaces,
        total: response.total,
        has_more: response.has_more,
      };
    } catch (error: any) {
      throw new Error(`Failed to find spaces: ${error.message}`);
    }
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findForm = createAction({
  auth: paperformAuth,
  name: 'findForm',
  displayName: 'Find Form',
  description: 'Retrieve form metadata or configuration by ID or name.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Forms',
      description: 'Search forms by title or ID (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search } = propsValue;
    
    try {
      const response = await paperformCommon.getForms({
        auth: auth as string,
        search: search as string,
        limit: 100,
      });
      
      return {
        success: true,
        message: `Found ${response.results.forms.length} form(s)${search ? ` matching "${search}"` : ''}.`,
        forms: response.results.forms,
        total: response.total,
        has_more: response.has_more,
      };
    } catch (error: any) {
      throw new Error(`Failed to find forms: ${error.message}`);
    }
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';

export const getAccountInfo = createAction({
  auth: apitemplateAuth,
  name: 'get_account_info',
  displayName: 'List Templates (Account Info)',
  description: 'List your templates (used as account verification since no dedicated account endpoint exists)',
  props: {},
  async run(context) {
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const result = await client.getAccountInfo();
      
      return {
        success: true,
        message: 'Templates retrieved successfully (account is valid)',
        templates_count: Array.isArray(result) ? result.length : 0,
        templates: result,
      };
    } catch (error) {
      throw new Error(`Failed to get templates: ${error}`);
    }
  },
});
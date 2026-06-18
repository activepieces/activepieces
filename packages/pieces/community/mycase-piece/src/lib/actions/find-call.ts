import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../auth';
import { createMyCaseApi } from '../common/mycase-api';

export const findCall = createAction({
  auth: mycaseAuth,
  name: 'find_call',
  displayName: 'Find Call',
  description: 'Searches for calls with optional filters',
  audience: 'both',
  aiMetadata: { description: 'List or search MyCase call-log entries, optionally filtering by last-updated date and limiting page size. Use to review logged phone calls or look one up. Read-only and idempotent. To log a new call, use Create Call.', idempotent: true },
  props: {
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter calls updated after this date and time',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (1-1000)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const queryParams: Record<string, string> = {};
    
    if (context.propsValue.updated_after) {
      // Convert DateTime to ISO string format
      queryParams['filter[updated_after]'] = new Date(context.propsValue.updated_after).toISOString();
    }
    
    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    try {
      const response = await api.get('/calls', queryParams);
      
      if (response.success) {
        return {
          success: true,
          calls: response.data,
          count: Array.isArray(response.data) ? response.data.length : 0,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find calls',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

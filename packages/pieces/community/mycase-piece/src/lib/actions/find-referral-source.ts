import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../auth';
import { createMyCaseApi } from '../common/mycase-api';

export const findReferralSource = createAction({
  auth: mycaseAuth,
  name: 'find_referral_source',
  displayName: 'Find Referral Source',
  description: 'Searches for referral sources with optional filters',
  audience: 'both',
  aiMetadata: { description: 'Read-only list of MyCase referral sources, optionally filtered by an updated-after timestamp and page size. Use to find an existing referral source ID before attaching it to a lead. Pure lookup with no side effects, safe to call repeatedly.', idempotent: true },
  props: {
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter referral sources updated after this date and time',
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
      const response = await api.get('/referral_sources', queryParams);
      
      if (response.success) {
        return {
          success: true,
          referral_sources: response.data,
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
        error: 'Failed to find referral sources',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

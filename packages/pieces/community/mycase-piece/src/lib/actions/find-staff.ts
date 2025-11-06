import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findStaff = createAction({
  auth: mycaseAuth,
  name: 'find_staff',
  displayName: 'Find Staff',
  description: 'Searches for staff members with optional filters',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by staff status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter staff updated after this date and time',
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
    
    if (context.propsValue.status) {
      queryParams['filter[status]'] = context.propsValue.status;
    }
    
    if (context.propsValue.updated_after) {
      // Convert DateTime to ISO string format
      queryParams['filter[updated_after]'] = new Date(context.propsValue.updated_after).toISOString();
    }
    
    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    try {
      const response = await api.get('/staff', queryParams);
      
      if (response.success) {
        return {
          success: true,
          staff: response.data,
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
        error: 'Failed to find staff',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

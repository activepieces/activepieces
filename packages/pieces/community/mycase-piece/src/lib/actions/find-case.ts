import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findCase = createAction({
  auth: mycaseAuth,
  name: 'find_case',
  displayName: 'Find Case',
  description: 'Searches for cases with optional filters',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by case status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter cases updated after this date and time',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (1-1000)',
      required: false,
      defaultValue: 25,
    }),
    client_fields: Property.ShortText({
      displayName: 'Client Fields',
      description: 'Comma-separated list of client fields to include (e.g., id,first_name,last_name)',
      required: false,
    }),
    custom_field_fields: Property.ShortText({
      displayName: 'Custom Field Fields',
      description: 'Comma-separated list of custom field fields to include (e.g., id,field_type)',
      required: false,
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
    
    if (context.propsValue.client_fields) {
      queryParams['field[client]'] = context.propsValue.client_fields;
    }
    
    if (context.propsValue.custom_field_fields) {
      queryParams['field[custom_field]'] = context.propsValue.custom_field_fields;
    }

    try {
      const response = await api.get('/cases', queryParams);
      
      if (response.success) {
        return {
          success: true,
          cases: response.data,
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
        error: 'Failed to find cases',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

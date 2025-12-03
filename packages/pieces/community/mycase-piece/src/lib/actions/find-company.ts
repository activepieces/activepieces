import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findCompany = createAction({
  auth: mycaseAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Searches for companies with optional filters',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Filter by company name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by email address',
      required: false,
    }),
    main_phone_number: Property.ShortText({
      displayName: 'Main Phone Number',
      description: 'Filter by main phone number',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Filter by fax phone number',
      required: false,
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter companies updated after this date and time',
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
    
    if (context.propsValue.name) {
      queryParams['filter[name]'] = context.propsValue.name;
    }
    
    if (context.propsValue.email) {
      queryParams['filter[email]'] = context.propsValue.email;
    }
    
    if (context.propsValue.main_phone_number) {
      queryParams['filter[main_phone_number]'] = context.propsValue.main_phone_number;
    }
    
    if (context.propsValue.fax_phone_number) {
      queryParams['filter[fax_phone_number]'] = context.propsValue.fax_phone_number;
    }
    
    if (context.propsValue.updated_after) {
      // Convert DateTime to ISO string format
      queryParams['filter[updated_after]'] = new Date(context.propsValue.updated_after).toISOString();
    }
    
    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    try {
      const response = await api.get('/companies', queryParams);
      
      if (response.success) {
        return {
          success: true,
          companies: response.data,
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
        error: 'Failed to find companies',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

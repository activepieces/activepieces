import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findPerson = createAction({
  auth: mycaseAuth,
  name: 'find_person',
  displayName: 'Find Person (Client)',
  description: 'Searches for clients (people) with optional filters',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Filter by first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filter by last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by email address',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone Number',
      description: 'Filter by cell phone number',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone Number',
      description: 'Filter by work phone number',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone Number',
      description: 'Filter by home phone number',
      required: false,
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description: 'Filter clients updated after this date and time',
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
    
    if (context.propsValue.first_name) {
      queryParams['filter[first_name]'] = context.propsValue.first_name;
    }
    
    if (context.propsValue.last_name) {
      queryParams['filter[last_name]'] = context.propsValue.last_name;
    }
    
    if (context.propsValue.email) {
      queryParams['filter[email]'] = context.propsValue.email;
    }
    
    if (context.propsValue.cell_phone_number) {
      queryParams['filter[cell_phone_number]'] = context.propsValue.cell_phone_number;
    }
    
    if (context.propsValue.work_phone_number) {
      queryParams['filter[work_phone_number]'] = context.propsValue.work_phone_number;
    }
    
    if (context.propsValue.home_phone_number) {
      queryParams['filter[home_phone_number]'] = context.propsValue.home_phone_number;
    }
    
    if (context.propsValue.updated_after) {
      // Convert DateTime to ISO string format
      queryParams['filter[updated_after]'] = new Date(context.propsValue.updated_after).toISOString();
    }
    
    if (context.propsValue.page_size) {
      queryParams['page_size'] = context.propsValue.page_size.toString();
    }

    try {
      const response = await api.get('/clients', queryParams);
      
      if (response.success) {
        return {
          success: true,
          clients: response.data,
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
        error: 'Failed to find clients',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

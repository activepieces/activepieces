import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createCompany = createAction({
  auth: mycaseAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email address',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    main_phone_number: Property.ShortText({
      displayName: 'Main Phone Number',
      description: 'Main phone number for the company',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Fax phone number for the company',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address line 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Street address line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State',
      required: false,
    }),
    zip_code: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP/Postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information about the company (visible to firm members only)',
      required: false,
    }),
    case_ids: Property.ShortText({
      displayName: 'Case IDs',
      description: 'Comma-separated list of case IDs to associate with the company',
      required: false,
    }),
    client_ids: Property.ShortText({
      displayName: 'Client IDs',
      description: 'Comma-separated list of client IDs to associate with the company',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      name: context.propsValue.name,
    };

    // Add optional fields if provided
    if (context.propsValue.email) {
      requestBody.email = context.propsValue.email;
    }
    
    if (context.propsValue.website) {
      requestBody.website = context.propsValue.website;
    }
    
    if (context.propsValue.main_phone_number) {
      requestBody.main_phone_number = context.propsValue.main_phone_number;
    }
    
    if (context.propsValue.fax_phone_number) {
      requestBody.fax_phone_number = context.propsValue.fax_phone_number;
    }
    
    if (context.propsValue.notes) {
      requestBody.notes = context.propsValue.notes;
    }

    // Add address if any address fields are provided
    const hasAddress = context.propsValue.address1 || context.propsValue.city || 
                       context.propsValue.state || context.propsValue.zip_code || 
                       context.propsValue.country;
    
    if (hasAddress) {
      requestBody.address = {
        address1: context.propsValue.address1 || '',
        address2: context.propsValue.address2 || '',
        city: context.propsValue.city || '',
        state: context.propsValue.state || '',
        zip_code: context.propsValue.zip_code || '',
        country: context.propsValue.country || '',
      };
    }

    // Add cases if provided
    if (context.propsValue.case_ids) {
      const caseIds = context.propsValue.case_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      
      if (caseIds.length > 0) {
        requestBody.cases = caseIds.map(id => ({ id }));
      }
    }

    // Add clients if provided
    if (context.propsValue.client_ids) {
      const clientIds = context.propsValue.client_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      
      if (clientIds.length > 0) {
        requestBody.clients = clientIds.map(id => ({ id }));
      }
    }

    try {
      const response = await api.post('/companies', requestBody);
      
      if (response.success) {
        return {
          success: true,
          company: response.data,
          message: `Company "${context.propsValue.name}" created successfully`,
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
        error: 'Failed to create company',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreateCompany = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_company',
  displayName: 'Find or Create Company',
  description: 'Finds a company by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company to find or create',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email address (used only when creating)',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL (used only when creating)',
      required: false,
    }),
    main_phone_number: Property.ShortText({
      displayName: 'Main Phone Number',
      description: 'Main phone number for the company (used only when creating)',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Fax phone number for the company (used only when creating)',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address line 1 (used only when creating)',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Street address line 2 (used only when creating)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City (used only when creating)',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State (used only when creating)',
      required: false,
    }),
    zip_code: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP/Postal code (used only when creating)',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country (used only when creating)',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information about the company (used only when creating)',
      required: false,
    }),
    case_ids: Property.ShortText({
      displayName: 'Case IDs',
      description: 'Comma-separated list of case IDs to associate (used only when creating)',
      required: false,
    }),
    client_ids: Property.ShortText({
      displayName: 'Client IDs',
      description: 'Comma-separated list of client IDs to associate (used only when creating)',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const companyName = context.propsValue.name;

    try {
      // First, try to find the company
      const findResponse = await api.get('/companies', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        const existingCompany = findResponse.data.find(
          (c: any) => c.name && c.name.toLowerCase() === companyName.toLowerCase()
        );

        if (existingCompany) {
          return {
            success: true,
            company: existingCompany,
            created: false,
            message: `Company "${companyName}" found`
          };
        }
      }

      // Company not found, create a new one
      const requestBody: any = {
        name: companyName,
      };

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

      if (context.propsValue.case_ids) {
        const caseIds = context.propsValue.case_ids
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));
        
        if (caseIds.length > 0) {
          requestBody.cases = caseIds.map(id => ({ id }));
        }
      }

      if (context.propsValue.client_ids) {
        const clientIds = context.propsValue.client_ids
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));
        
        if (clientIds.length > 0) {
          requestBody.clients = clientIds.map(id => ({ id }));
        }
      }

      const createResponse = await api.post('/companies', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          company: createResponse.data,
          created: true,
          message: `Company "${companyName}" created successfully`
        };
      } else {
        return {
          success: false,
          error: createResponse.error,
          details: createResponse.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find or create company',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

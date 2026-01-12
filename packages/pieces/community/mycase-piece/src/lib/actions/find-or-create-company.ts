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
    cases: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Cases',
      description: 'Cases to associate with the company (used only when creating)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/cases', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((caseItem: any) => ({
              label: `${caseItem.name}${caseItem.case_number ? ` (${caseItem.case_number})` : ''}`,
              value: caseItem.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load cases',
        };
      },
    }),
    clients: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Clients',
      description: 'Clients to associate with the company (used only when creating)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/clients', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((client: any) => ({
              label: `${client.first_name} ${client.last_name}${client.email ? ` (${client.email})` : ''}`,
              value: client.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load clients',
        };
      },
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

      // Add cases if provided
      if (context.propsValue.cases && Array.isArray(context.propsValue.cases)) {
        requestBody.cases = context.propsValue.cases.map(id => ({ id: parseInt(id) }));
      }

      // Add clients if provided
      if (context.propsValue.clients && Array.isArray(context.propsValue.clients)) {
        requestBody.clients = context.propsValue.clients.map(id => ({ id: parseInt(id) }));
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

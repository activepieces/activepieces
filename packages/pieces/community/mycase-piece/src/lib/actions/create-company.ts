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
    cases: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Cases',
      description: 'Cases to associate with the company',
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
      description: 'Clients to associate with the company',
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
    if (context.propsValue.cases && Array.isArray(context.propsValue.cases)) {
      requestBody.cases = context.propsValue.cases.map(id => ({ id: parseInt(id) }));
    }

    // Add clients if provided
    if (context.propsValue.clients && Array.isArray(context.propsValue.clients)) {
      requestBody.clients = context.propsValue.clients.map(id => ({ id: parseInt(id) }));
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
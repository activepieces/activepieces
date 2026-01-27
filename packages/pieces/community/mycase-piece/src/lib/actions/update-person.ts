import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const updatePerson = createAction({
  auth: mycaseAuth,
  name: 'update_person',
  displayName: 'Update Person (Client)',
  description: 'Updates an existing individual client (person) in MyCase',
  props: {
    client_id: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Client',
      description: 'Select the client to update',
      required: true,
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
              label: `${client.first_name} ${client.last_name}${client.email ? ` (${client.email})` : ''} - ID: ${client.id}`,
              value: client.id,
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
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the client',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the client',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the client',
      required: false,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the client',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone Number',
      description: 'Cell phone number',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone Number',
      description: 'Work phone number',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone Number',
      description: 'Home phone number',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Fax phone number',
      required: false,
    }),
    birthdate: Property.DateTime({
      displayName: 'Birthdate',
      description: 'Date of birth',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information (visible to firm members only)',
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
    people_group: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'People Group',
      description: 'The people group to associate with this client',
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
        const response = await api.get('/people_groups', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((group: any) => ({
              label: group.name,
              value: group.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load people groups',
        };
      },
    }),
    cases: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Cases',
      description: 'Cases to associate with this client',
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
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const requestBody: any = {
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
    };

    if (context.propsValue.email) requestBody.email = context.propsValue.email;
    if (context.propsValue.middle_name) requestBody.middle_name = context.propsValue.middle_name;
    if (context.propsValue.cell_phone_number) requestBody.cell_phone_number = context.propsValue.cell_phone_number;
    if (context.propsValue.work_phone_number) requestBody.work_phone_number = context.propsValue.work_phone_number;
    if (context.propsValue.home_phone_number) requestBody.home_phone_number = context.propsValue.home_phone_number;
    if (context.propsValue.fax_phone_number) requestBody.fax_phone_number = context.propsValue.fax_phone_number;
    if (context.propsValue.birthdate) {
      // Convert DateTime to ISO date format
      const date = new Date(context.propsValue.birthdate);
      requestBody.birthdate = date.toISOString().split('T')[0];
    }
    if (context.propsValue.notes) requestBody.notes = context.propsValue.notes;

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

    // Add people group if provided
    if (context.propsValue.people_group) {
      requestBody.people_group = {
        id: parseInt(context.propsValue.people_group),
      };
    }

    // Add cases if provided
    if (context.propsValue.cases && Array.isArray(context.propsValue.cases)) {
      requestBody.cases = context.propsValue.cases.map(id => ({ id: parseInt(id) }));
    }

    try {
      const response = await api.put(`/clients/${context.propsValue.client_id}`, requestBody);
      
      if (response.success) {
        return {
          success: true,
          message: `Client ${context.propsValue.client_id} updated successfully`,
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
        error: 'Failed to update client',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

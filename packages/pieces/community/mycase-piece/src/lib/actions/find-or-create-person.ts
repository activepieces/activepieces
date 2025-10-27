import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreatePerson = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_person',
  displayName: 'Find or Create Person (Client)',
  description: 'Finds a person by first and last name or creates a new one if not found',
  props: {
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
      description: 'The email of the client (used only when creating)',
      required: false,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      description: 'The middle name of the client (used only when creating)',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone Number',
      description: 'Cell phone number (used only when creating)',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone Number',
      description: 'Work phone number (used only when creating)',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone Number',
      description: 'Home phone number (used only when creating)',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone Number',
      description: 'Fax phone number (used only when creating)',
      required: false,
    }),
    birthdate: Property.ShortText({
      displayName: 'Birthdate',
      description: 'Date of birth in ISO-8601 format: YYYY-MM-DD (used only when creating)',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional information (used only when creating)',
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
    people_group_id: Property.Number({
      displayName: 'People Group ID',
      description: 'ID of the people group to associate (used only when creating)',
      required: false,
    }),
    case_ids: Property.ShortText({
      displayName: 'Case IDs',
      description: 'Comma-separated list of case IDs to associate (used only when creating)',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const firstName = context.propsValue.first_name;
    const lastName = context.propsValue.last_name;

    try {
      // First, try to find the person
      const findResponse = await api.get('/clients', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        const existingPerson = findResponse.data.find(
          (p: any) => 
            p.first_name && p.last_name &&
            p.first_name.toLowerCase() === firstName.toLowerCase() &&
            p.last_name.toLowerCase() === lastName.toLowerCase()
        );

        if (existingPerson) {
          return {
            success: true,
            client: existingPerson,
            created: false,
            message: `Client "${firstName} ${lastName}" found`
          };
        }
      }

      // Person not found, create a new one
      const requestBody: any = {
        first_name: firstName,
        last_name: lastName,
      };

      if (context.propsValue.email) {
        requestBody.email = context.propsValue.email;
      }
      
      if (context.propsValue.middle_name) {
        requestBody.middle_name = context.propsValue.middle_name;
      }
      
      if (context.propsValue.cell_phone_number) {
        requestBody.cell_phone_number = context.propsValue.cell_phone_number;
      }
      
      if (context.propsValue.work_phone_number) {
        requestBody.work_phone_number = context.propsValue.work_phone_number;
      }
      
      if (context.propsValue.home_phone_number) {
        requestBody.home_phone_number = context.propsValue.home_phone_number;
      }
      
      if (context.propsValue.fax_phone_number) {
        requestBody.fax_phone_number = context.propsValue.fax_phone_number;
      }
      
      if (context.propsValue.birthdate) {
        requestBody.birthdate = context.propsValue.birthdate;
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

      if (context.propsValue.people_group_id) {
        requestBody.people_group = {
          id: context.propsValue.people_group_id,
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

      const createResponse = await api.post('/clients', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          client: createResponse.data,
          created: true,
          message: `Client "${firstName} ${lastName}" created successfully`
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
        error: 'Failed to find or create client',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

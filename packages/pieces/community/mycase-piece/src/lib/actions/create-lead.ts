import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createLead = createAction({
  auth: mycaseAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Creates a new lead in MyCase',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the lead',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the lead',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the lead',
      required: false,
    }),
    middle_initial: Property.ShortText({
      displayName: 'Middle Initial',
      description: 'The middle name or initial of the lead',
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
    birthdate: Property.ShortText({
      displayName: 'Birthdate',
      description: 'Date of birth in ISO-8601 format (YYYY-MM-DD)',
      required: false,
    }),
    drivers_license_number: Property.ShortText({
      displayName: 'Drivers License Number',
      description: 'Drivers license number',
      required: false,
    }),
    drivers_license_state: Property.ShortText({
      displayName: 'Drivers License State',
      description: 'Drivers license state',
      required: false,
    }),
    lead_details: Property.LongText({
      displayName: 'Lead Details',
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
    referral_source_id: Property.Number({
      displayName: 'Referral Source ID',
      description: 'ID of the referral source to associate with this lead',
      required: false,
    }),
    referred_by_id: Property.Number({
      displayName: 'Referred By ID',
      description: 'ID of the existing client or company who referred this lead',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
    };

    // Add optional fields
    if (context.propsValue.email) {
      requestBody.email = context.propsValue.email;
    }
    
    if (context.propsValue.middle_initial) {
      requestBody.middle_initial = context.propsValue.middle_initial;
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
    
    if (context.propsValue.birthdate) {
      requestBody.birthdate = context.propsValue.birthdate;
    }
    
    if (context.propsValue.drivers_license_number) {
      requestBody.drivers_license_number = context.propsValue.drivers_license_number;
    }
    
    if (context.propsValue.drivers_license_state) {
      requestBody.drivers_license_state = context.propsValue.drivers_license_state;
    }
    
    if (context.propsValue.lead_details) {
      requestBody.lead_details = context.propsValue.lead_details;
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

    // Add referral source if provided
    if (context.propsValue.referral_source_id) {
      requestBody.referral_source_reference = {
        id: context.propsValue.referral_source_id,
      };
    }

    // Add referred by if provided
    if (context.propsValue.referred_by_id) {
      requestBody.referred_by = {
        id: context.propsValue.referred_by_id,
      };
    }

    try {
      const response = await api.post('/leads', requestBody);
      
      if (response.success) {
        return {
          success: true,
          lead: response.data,
          message: `Lead "${context.propsValue.first_name} ${context.propsValue.last_name}" created successfully`,
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
        error: 'Failed to create lead',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
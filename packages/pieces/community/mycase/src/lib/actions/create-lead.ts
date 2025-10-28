import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { referralSourceDropdown, multiClientDropdown, multiCompanyDropdown, clientsAndCompaniesDropdown } from '../common/props';

export const createLead = createAction({
  auth: myCaseAuth,
  name: 'createLead',
  displayName: 'Create Lead',
  description: 'Creates a new lead',
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
    middle_initial: Property.ShortText({
      displayName: 'Middle Initial',
      description: 'The middle name or initial of the lead',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the lead',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone Number',
      description: 'The lead\'s cell phone number',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone Number',
      description: 'The lead\'s work phone number',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone Number',
      description: 'The lead\'s home phone number',
      required: false,
    }),
    include_address: Property.Checkbox({
      displayName: 'Include Address',
      description: 'Check to add address information',
      required: false,
      defaultValue: false,
    }),
    address_fields: Property.DynamicProperties({
      displayName: 'Address',
      description: 'Address information',
      required: false,
      refreshers: ['include_address'],
      props: async (propsValue) => {
        const includeAddress = propsValue['include_address'];
        
        if (!includeAddress) {
          return {};
        }

        const addressProperties = {
          address1: Property.ShortText({
            displayName: 'Address Line 1',
            description: 'Street address line 1',
            required: true,
          }),
          address2: Property.ShortText({
            displayName: 'Address Line 2',
            description: 'Street address line 2',
            required: true,
          }),
          city: Property.ShortText({
            displayName: 'City',
            description: 'City',
            required: true,
          }),
          state: Property.ShortText({
            displayName: 'State',
            description: 'State',
            required: true,
          }),
          zip_code: Property.ShortText({
            displayName: 'ZIP Code',
            description: 'ZIP/Postal code',
            required: true,
          }),
          country: Property.ShortText({
            displayName: 'Country',
            description: 'Country',
            required: true,
          }),
        };
        
        return addressProperties;
      },
    }),
    birthdate: Property.DateTime({
      displayName: 'Birthdate',
      description: 'The lead\'s date of birth',
      required: false,
    }),
    drivers_license_number: Property.ShortText({
      displayName: 'Driver\'s License Number',
      description: 'The lead\'s driver\'s license number',
      required: false,
    }),
    drivers_license_state: Property.ShortText({
      displayName: 'Driver\'s License State',
      description: 'The lead\'s driver\'s license state',
      required: false,
    }),
    lead_details: Property.LongText({
      displayName: 'Lead Details',
      description: 'Additional information about the lead (visible to firm members only)',
      required: false,
    }),
    referral_source_id: referralSourceDropdown({
      description: 'Select the referral source for this lead',
      required: false,
    }),
    referred_by: clientsAndCompaniesDropdown({
      displayName: 'Referred By',
      description: 'Select who referred this lead',
      required: false,
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const addressFields = (propsValue.address_fields as any) || {};

    const payload: any = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      middle_initial: propsValue.middle_initial,
      email: propsValue.email,
      cell_phone_number: propsValue.cell_phone_number,
      work_phone_number: propsValue.work_phone_number,
      home_phone_number: propsValue.home_phone_number,
      birthdate: propsValue.birthdate,
      drivers_license_number: propsValue.drivers_license_number,
      drivers_license_state: propsValue.drivers_license_state,
      lead_details: propsValue.lead_details,
      ...(propsValue.include_address && {
        address: {
          address1: addressFields.address1,
          address2: addressFields.address2 || '',
          city: addressFields.city,
          state: addressFields.state,
          zip_code: addressFields.zip_code,
          country: addressFields.country,
        },
      }),
    };

    if (propsValue.referred_by) {
      payload.referred_by = { id: propsValue.referred_by };
    }
    
    if (propsValue.referral_source_id) {
      payload.referral_source_reference = { id: propsValue.referral_source_id };
    }

    return await myCaseApiService.createLead({
      accessToken: auth.access_token,
      payload,
    });
  },
});
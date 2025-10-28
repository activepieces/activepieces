import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { multiClientDropdown, multiCasesDropdown } from '../common/props';

export const createCompany = createAction({
  auth: myCaseAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Creates a new company',
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
    notes: Property.LongText({
      displayName: 'Notes',
      description:
        'Additional information about the company (visible to firm members only)',
      required: false,
    }),
    case_ids: multiCasesDropdown({
      description: 'Select cases to associate with the company',
      required: false,
    }),
    client_ids: multiClientDropdown({
      description: 'Select clients to associate with the company',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const addressFields = (propsValue.address_fields as any) || {};

    const payload: any = {
      name: propsValue.name,
      email: propsValue.email,
      website: propsValue.website,
      main_phone_number: propsValue.main_phone_number,
      fax_phone_number: propsValue.fax_phone_number,
      notes: propsValue.notes,
      ...(propsValue.include_address && {
        address1: addressFields.address1,
        address2: addressFields.address2,
        city: addressFields.city,
        state: addressFields.state,
        zip_code: addressFields.zip_code,
        country: addressFields.country,
      }),
    };

    if (propsValue.case_ids && Array.isArray(propsValue.case_ids)) {
      payload.case_ids = propsValue.case_ids.map((id) => {
        id;
      });
    }

    if (propsValue.client_ids && Array.isArray(propsValue.client_ids)) {
      payload.client_ids = propsValue.client_ids.map((id) => {
        id;
      });
    }

    return await myCaseApiService.createCompany({
      accessToken: auth.access_token,
      payload,
    });
  },
});

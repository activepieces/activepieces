import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { clientDropdown, multiCasesDropdown, peopleGroupDropdown } from '../common/props';
import { myCaseApiService } from '../common/requests';

export const updatePerson = createAction({
  auth: myCaseAuth,
  name: 'updatePerson',
  displayName: 'Update Person',
  description: 'updates an existing person',
  props: {
    person_id: clientDropdown({
      description: 'Select the person you want to update.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name',
      required: true,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      description: 'Middle name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    cell_phone_number: Property.ShortText({
      displayName: 'Cell Phone',
      description: 'Cell phone number',
      required: false,
    }),
    work_phone_number: Property.ShortText({
      displayName: 'Work Phone',
      description: 'Work phone number',
      required: false,
    }),
    home_phone_number: Property.ShortText({
      displayName: 'Home Phone',
      description: 'Home phone number',
      required: false,
    }),
    fax_phone_number: Property.ShortText({
      displayName: 'Fax Phone',
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
    people_group_id: peopleGroupDropdown({
      description: 'Select a people group to associate with this person',
      required: false,
    }),
    case_ids: multiCasesDropdown({
      description: 'Select cases to associate with this person',
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
      props: async ({ include_address }) => {
        if (!include_address) return {};

        const addressProps = {
          address1: Property.ShortText({
            displayName: 'Address Line 1',
            description: 'Street address line 1',
            required: true,
          }),
          address2: Property.ShortText({
            displayName: 'Address Line 2',
            description: 'Street address line 2',
            required: false,
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

        return addressProps;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: any = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      middle_name: propsValue.middle_name,
      email: propsValue.email,
      cell_phone_number: propsValue.cell_phone_number,
      work_phone_number: propsValue.work_phone_number,
      home_phone_number: propsValue.home_phone_number,
      fax_phone_number: propsValue.fax_phone_number,
      birthdate: propsValue.birthdate,
      notes: propsValue.notes,
      ...(propsValue.people_group_id && {
        people_group: { id: propsValue.people_group_id },
      }),
      ...(propsValue.case_ids &&
        propsValue.case_ids.length > 0 && {
          cases: propsValue.case_ids.map((id: number) => ({ id })),
        }),
      ...(propsValue.include_address &&
        propsValue.address_fields && {
          address: {
            address1: propsValue.address_fields['address1'],
            address2: propsValue.address_fields['address2'] || '',
            city: propsValue.address_fields['city'],
            state: propsValue.address_fields['state'],
            zip_code: propsValue.address_fields['zip_code'],
            country: propsValue.address_fields['country'],
          },
        }),
    };

    return await myCaseApiService.updatePerson({
      accessToken: auth.access_token,
      personId: propsValue.person_id,
      payload,
    });
  },
});

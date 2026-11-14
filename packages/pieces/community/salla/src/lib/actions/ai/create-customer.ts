import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaCustomers } from '../../common/customers';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiCreateCustomerAction = createAction({
  auth: sallaAuth,
  name: 'ai_create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Creates a new customer in the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Salla customer from a first name, last name and mobile number with its country code, plus optional email, gender, birthday and customer groups. Use List Customers first to check the customer does not already exist, and Update Customer to change one. Fails, and sends nothing, when another customer already has the mobile or the email, so a retry after a success fails too.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.savedCustomer,
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name, for example Sara.',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name, for example Al-Qahtani.',
      required: true,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number with the country code, for example +966501234567. Must not belong to another customer in the store.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Two-letter country code of the customer, for example SA. Needed when the mobile starts with +1 or +7, or with a calling code the piece does not recognise; otherwise it is worked out from the mobile.',
      required: false,
    }),
    mobile_country_code: Property.ShortText({
      displayName: 'Mobile Country Code',
      description:
        'Calling code of the mobile, for example +966. Needed only when the country code cannot be told from the mobile; leave empty when the mobile starts with +966 or another common code.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address, for example sara@example.com. Must not belong to another customer in the store.',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'male or female. Leave empty to not set it. Salla accepts it but may not save it, so it can come back empty.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ],
      },
    }),
    birthday: Property.ShortText({
      displayName: 'Birthday',
      description: 'Date of birth, format YYYY-MM-DD, for example 1994-03-21. Salla accepts it but may not save it, so it can come back empty.',
      required: false,
    }),
    group_ids: Property.Array({
      displayName: 'Customer Group IDs',
      description: 'Numeric customer group IDs from List Customer Groups, for example ["1227534533"]. Leave empty for no group.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.createCustomer({
      auth,
      input: {
        firstName: propsValue.first_name,
        lastName: propsValue.last_name,
        mobile: propsValue.mobile,
        countryCode: propsValue.country_code,
        mobileCountryCode: propsValue.mobile_country_code,
        email: propsValue.email,
        gender: propsValue.gender,
        birthday: propsValue.birthday,
        groupIds: sallaUtils.toStringList(propsValue.group_ids),
      },
    });
  },
});

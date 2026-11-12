import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { CUSTOMER_GENDERS, CustomerGender, sallaCustomers } from '../common/customers';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const createCustomerAction = createAction({
  auth: sallaAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Adds a customer to the store. The email and the mobile number must not belong to another customer in the store.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one new Salla customer from a first name, last name and mobile number with its country code, plus optional email, gender, birthday and groups. Use Update Customer to change a customer who already exists, and Find Customers first if the person may already be in the store. Salla rejects a mobile or email already used by another customer; each call creates a separate customer, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.savedCustomer,
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      description: 'The email and the mobile number must be unique in the store.',
      icon: 'user',
      props: ['first_name', 'last_name', 'mobile', 'email'],
    },
  ],
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Customer first name, for example Sara.',
      placeholder: 'Sara',
      width: 'half',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Customer last name, for example Alqahtani.',
      placeholder: 'Alqahtani',
      width: 'half',
      required: true,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description:
        'Mobile with the country code, for example +966501234567. A number without the code, such as 0501234567, works only when Mobile Country Code or Country Code is filled under Advanced. Must not belong to another customer in the store.',
      placeholder: '+966501234567',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Customer email, for example sara@example.com. Must not belong to another customer in the store.',
      placeholder: 'sara@example.com',
      required: false,
    }),
    gender: Property.StaticDropdown<CustomerGender, false>({
      displayName: 'Gender',
      description: 'Male or Female. Leave empty if you do not know. Salla accepts it but may not save it: on our test store it was never returned afterwards.',
      advanced: true,
      required: false,
      options: { options: genderOptions() },
    }),
    birthday: Property.DateTime({
      displayName: 'Birthday',
      description: 'Customer date of birth, for example 1990-05-15. Salla keeps the day only. Salla accepts it but may not save it: on our test store it was never returned afterwards.',
      advanced: true,
      required: false,
    }),
    groups: {
      ...sallaProps.customerGroups({
        required: false,
        description: 'Customer groups to put the customer in, for example VIP Customers. In a flow, map numeric group IDs such as 1226617469.',
      }),
      advanced: true,
    },
    mobile_country_code: Property.ShortText({
      displayName: 'Mobile Country Code',
      description:
        'Calling code of the mobile number, for example +966. Fill it only when the mobile number is given without its country code, or when the code cannot be read from it.',
      placeholder: '+966',
      advanced: true,
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Two-letter country of the customer, for example SA. Worked out from the mobile country code when empty; fill it when Salla cannot tell, for example for +1 numbers.',
      placeholder: 'SA',
      advanced: true,
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
        email: propsValue.email ?? undefined,
        gender: propsValue.gender ?? undefined,
        birthday: sallaUtils.wallClockFromDateTimeProp(propsValue.birthday),
        groupIds: propsValue.groups ?? [],
        mobileCountryCode: propsValue.mobile_country_code ?? undefined,
        countryCode: propsValue.country_code ?? undefined,
      },
    });
  },
});

export function genderOptions(): Array<{ label: string; value: CustomerGender }> {
  return CUSTOMER_GENDERS.map((gender) => ({ label: gender === 'male' ? 'Male' : 'Female', value: gender }));
}

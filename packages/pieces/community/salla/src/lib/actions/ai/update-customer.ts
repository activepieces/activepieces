import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaCustomers } from '../../common/customers';
import { sallaUtils } from '../../common/helpers';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiUpdateCustomerAction = createAction({
  auth: sallaAuth,
  name: 'ai_update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Changes the details of an existing customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an existing Salla customer found by customer_id; only the fields you fill are sent and the rest stay as they are. Salla\'s docs do not say whether group_ids replaces the customer\'s groups or adds to them, so to add customers to a group without touching their other groups use Add Customers to Group. Find the customer_id with List Customers; a new email or mobile must not belong to another customer.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.savedCustomer,
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Numeric Salla customer ID, for example 1227534533. Find it with List Customers.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name, for example Sara.',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name, for example Al-Qahtani.',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'New mobile number with the country code, for example +966501234567.',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code of the customer, for example SA. Needed with a new mobile when it starts with +1 or +7, or with a calling code the piece does not recognise.',
      required: false,
    }),
    mobile_country_code: Property.ShortText({
      displayName: 'Mobile Country Code',
      description:
        'Calling code of the new mobile, for example +966. Use it only together with mobile, and only when the country code cannot be told from the mobile.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email address, for example sara@example.com.',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'male or female. Leave empty to keep the current gender. Salla accepts it but may not save it, so it can come back empty.',
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
      description: 'New date of birth, format YYYY-MM-DD, for example 1994-03-21. Salla accepts it but may not save it, so it can come back empty.',
      required: false,
    }),
    group_ids: Property.Array({
      displayName: 'Customer Group IDs',
      description:
        'Numeric customer group IDs from List Customer Groups, for example ["1227534533"]. Salla\'s docs do not say whether this replaces the current groups or adds to them; Add Customers to Group adds without touching other groups. Leave empty to keep the current groups.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.updateCustomer({
      auth,
      customerId: propsValue.customer_id,
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

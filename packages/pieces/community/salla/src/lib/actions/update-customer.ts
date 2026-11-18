import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { CustomerGender, sallaCustomers } from '../common/customers';
import { sallaUtils } from '../common/helpers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { genderOptions } from './create-customer';

export const updateCustomerAction = createAction({
  auth: sallaAuth,
  name: 'update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Changes the details of a customer. Only the fields you fill are changed.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates one Salla customer, picked by numeric customer ID, and changes only the fields you fill: name, mobile, email, gender, birthday or groups. Use Create Customer for a new person and Add Customers to Group to add customers to a group without touching their other groups. Salla may not save a new gender or birthday, and any update can clear a birthday saved earlier. Sending the same values again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.savedCustomer,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Customer to Update',
      icon: 'user',
      props: ['customer'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      description: 'Fill only what changes. The email and the mobile number must not belong to another customer.',
      icon: 'file',
      props: ['first_name', 'last_name', 'mobile', 'email', 'gender', 'birthday'],
    },
  ],
  props: {
    customer: sallaProps.customer({
      required: true,
      description: 'The customer to update. Search by name or mobile, or map the numeric customer ID, for example 1227534533.',
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name, for example Sara. Leave empty to keep it.',
      placeholder: 'Sara',
      width: 'half',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name, for example Alqahtani. Leave empty to keep it.',
      placeholder: 'Alqahtani',
      width: 'half',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description:
        'New mobile with the country code, for example +966501234567. Must not belong to another customer in the store. Leave empty to keep it.',
      placeholder: '+966501234567',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email, for example sara@example.com. Must not belong to another customer in the store. Leave empty to keep it.',
      placeholder: 'sara@example.com',
      required: false,
    }),
    gender: Property.StaticDropdown<CustomerGender, false>({
      displayName: 'Gender',
      description: 'Male or Female. Leave empty to keep it. Salla accepts it but may not save it: on our test store an update never changed it.',
      width: 'half',
      required: false,
      options: { options: genderOptions() },
    }),
    birthday: Property.DateTime({
      displayName: 'Birthday',
      description: 'New date of birth, for example 1990-05-15. Salla accepts it but may not save it: on our test store an update never changed it. Any update, even one that leaves this empty, can clear a birthday saved earlier.',
      width: 'half',
      required: false,
    }),
    groups: {
      ...sallaProps.customerGroups({
        required: false,
        description:
          "Sets the customer's groups, for example VIP Customers. Salla's docs do not say whether this replaces the current groups or adds to them, so check on a test customer first. To add to a group and keep the others, use Add Customers to Group. Leave empty to keep the groups.",
      }),
      advanced: true,
    },
    mobile_country_code: Property.ShortText({
      displayName: 'Mobile Country Code',
      description:
        'Calling code of the new mobile number, for example +966. Fill it only together with Mobile, when the number is given without its country code.',
      placeholder: '+966',
      advanced: true,
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country of the customer, for example SA. Leave empty to keep it, or to work it out from the new mobile number.',
      placeholder: 'SA',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.updateCustomer({
      auth,
      customerId: propsValue.customer,
      input: {
        firstName: propsValue.first_name ?? undefined,
        lastName: propsValue.last_name ?? undefined,
        mobile: propsValue.mobile ?? undefined,
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

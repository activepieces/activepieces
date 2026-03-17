import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../..';
import { createQBEntity, QBCustomer } from '../common';

export const quickbooksCreateCustomer = createAction({
  auth: quickbooksAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer in QuickBooks.',
  props: {
    realm_id: Property.ShortText({
      displayName: 'Company ID (Realm ID)',
      description: 'Your QuickBooks Company ID.',
      required: true,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'The name to display for this customer (must be unique in QuickBooks).',
      required: true,
    }),
    given_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    family_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number (e.g., +1-555-123-4567)',
      required: false,
    }),
    billing_address_line1: Property.ShortText({
      displayName: 'Billing Address Line 1',
      required: false,
    }),
    billing_city: Property.ShortText({
      displayName: 'Billing City',
      required: false,
    }),
    billing_state: Property.ShortText({
      displayName: 'Billing State / Province',
      required: false,
    }),
    billing_postal_code: Property.ShortText({
      displayName: 'Billing Postal Code',
      required: false,
    }),
    billing_country: Property.ShortText({
      displayName: 'Billing Country',
      required: false,
    }),
    use_sandbox: Property.Checkbox({
      displayName: 'Use Sandbox',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      realm_id,
      display_name,
      given_name,
      family_name,
      company_name,
      email,
      phone,
      billing_address_line1,
      billing_city,
      billing_state,
      billing_postal_code,
      billing_country,
      use_sandbox,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      DisplayName: display_name,
    };

    if (given_name) body['GivenName'] = given_name;
    if (family_name) body['FamilyName'] = family_name;
    if (company_name) body['CompanyName'] = company_name;
    if (email) body['PrimaryEmailAddr'] = { Address: email };
    if (phone) body['PrimaryPhone'] = { FreeFormNumber: phone };

    const hasAddress =
      billing_address_line1 ||
      billing_city ||
      billing_state ||
      billing_postal_code ||
      billing_country;

    if (hasAddress) {
      body['BillAddr'] = {
        Line1: billing_address_line1,
        City: billing_city,
        CountrySubDivisionCode: billing_state,
        PostalCode: billing_postal_code,
        Country: billing_country,
      };
    }

    const customer = await createQBEntity<QBCustomer>(
      context.auth as any,
      realm_id,
      'customer',
      body,
      use_sandbox ?? false
    );

    return customer;
  },
});

import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

export const freeAgentCreateContact = createAction({
  displayName: 'Create Contact',
  description: 'Create a new contact in FreeAgent',
  auth: freeAgentAuth,
  name: 'create_contact',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (required if organization name is not specified)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (required if organization name is not specified)',
      required: false,
    }),
    organisation_name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Organization name (required if first and last name are not specified)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    billing_email: Property.ShortText({
      displayName: 'Billing Email',
      description: 'Billing email address',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Telephone number',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'First line of the address',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Second line of the address',
      required: false,
    }),
    address3: Property.ShortText({
      displayName: 'Address Line 3',
      description: 'Third line of the address',
      required: false,
    }),
    town: Property.ShortText({
      displayName: 'Town',
      description: 'Town or city',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description: 'Region or state',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Postcode',
      description: 'Post or ZIP code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    contact_name_on_invoices: Property.Checkbox({
      displayName: 'Show Contact Name on Invoices',
      description: 'Show contact name as well as organization name on invoices',
      required: false,
      defaultValue: false,
    }),
    default_payment_terms_in_days: Property.Number({
      displayName: 'Default Payment Terms (Days)',
      description: 'Default payment terms in days',
      required: false,
    }),
    charge_sales_tax: Property.StaticDropdown({
      displayName: 'Charge Sales Tax',
      description: 'How to handle sales tax for this contact',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'Auto' },
          { label: 'Always', value: 'Always' },
          { label: 'Never', value: 'Never' },
        ],
      },
      defaultValue: 'Auto',
    }),
    sales_tax_registration_number: Property.ShortText({
      displayName: 'Sales Tax Registration Number',
      description: 'Sales tax registration number if applicable',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Contact status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Hidden', value: 'Hidden' },
        ],
      },
      defaultValue: 'Active',
    }),
    locale: Property.StaticDropdown({
      displayName: 'Locale',
      description: 'Invoice/estimate language',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'English (US)', value: 'en-US' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese (Brazil)', value: 'pt-BR' },
        ],
      },
      defaultValue: 'en',
    }),
  },
  async run(context) {
    const {
      first_name,
      last_name,
      organisation_name,
      email,
      billing_email,
      phone_number,
      mobile,
      address1,
      address2,
      address3,
      town,
      region,
      postcode,
      country,
      contact_name_on_invoices,
      default_payment_terms_in_days,
      charge_sales_tax,
      sales_tax_registration_number,
      status,
      locale,
    } = context.propsValue;

    const auth = context.auth as OAuth2PropertyValue;

    const payload: any = {
      contact: {},
    };

    // Add basic contact information
    if (first_name) payload.contact.first_name = first_name;
    if (last_name) payload.contact.last_name = last_name;
    if (organisation_name) payload.contact.organisation_name = organisation_name;
    if (email) payload.contact.email = email;
    if (billing_email) payload.contact.billing_email = billing_email;
    if (phone_number) payload.contact.phone_number = phone_number;
    if (mobile) payload.contact.mobile = mobile;

    // Add address information
    if (address1) payload.contact.address1 = address1;
    if (address2) payload.contact.address2 = address2;
    if (address3) payload.contact.address3 = address3;
    if (town) payload.contact.town = town;
    if (region) payload.contact.region = region;
    if (postcode) payload.contact.postcode = postcode;
    if (country) payload.contact.country = country;

    // Add billing and tax information
    if (contact_name_on_invoices !== undefined) {
      payload.contact.contact_name_on_invoices = contact_name_on_invoices;
    }
    if (default_payment_terms_in_days !== undefined) {
      payload.contact.default_payment_terms_in_days = default_payment_terms_in_days;
    }
    if (charge_sales_tax) payload.contact.charge_sales_tax = charge_sales_tax;
    if (sales_tax_registration_number) {
      payload.contact.sales_tax_registration_number = sales_tax_registration_number;
    }
    if (status) payload.contact.status = status;
    if (locale) payload.contact.locale = locale;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.freeagent.com/v2/contacts',
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});

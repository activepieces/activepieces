import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';

export const createCompanyAction = createAction({
  auth: teamworkAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Create a new company/client record in Teamwork.',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company.',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address 1',
      description: 'The first line of the company\'s address.',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address 2',
      description: 'The second line of the company\'s address.',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city of the company.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state or province of the company.',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip/Postal Code',
      description: 'The zip or postal code of the company.',
      required: false,
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      description: 'The country of the company.',
      required: false,
      options: {
        options: [
          { label: 'United States', value: 'US' },
          { label: 'Canada', value: 'CA' },
          { label: 'United Kingdom', value: 'GB' },
          { label: 'Australia', value: 'AU' },
          { label: 'Germany', value: 'DE' },
          { label: 'France', value: 'FR' },
          { label: 'India', value: 'IN' },
          { label: 'Brazil', value: 'BR' },
          { label: 'China', value: 'CN' },
          { label: 'Japan', value: 'JP' },
          { label: 'Mexico', value: 'MX' },
        ],
      },
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The primary phone number for the company.',
      required: false,
    }),
    fax: Property.ShortText({
      displayName: 'Fax Number',
      description: 'The fax number for the company.',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The company\'s website URL.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const companyData = {
      name: propsValue.name,
      'address-one': propsValue.address1,
      'address-two': propsValue.address2,
      city: propsValue.city,
      state: propsValue.state,
      zip: propsValue.zip,
      country: propsValue.country,
      phone: propsValue.phone,
      fax: propsValue.fax,
      website: propsValue.website,
    };

    return await teamworkClient.createCompany(auth, companyData);
  },
});
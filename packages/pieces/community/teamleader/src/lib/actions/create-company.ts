import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCompany = createAction({
  auth: teamleaderAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Create a new company in Teamleader',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
    }),
    businessType: Property.StaticDropdown({
      displayName: 'Business Type',
      description: 'The type of business',
      required: true,
      options: {
        options: [
          { label: 'Prospect', value: 'prospect' },
          { label: 'Customer', value: 'customer' },
          { label: 'Supplier', value: 'supplier' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    vatNumber: Property.ShortText({
      displayName: 'VAT Number',
      description: 'The VAT number of the company',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses for the company',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Type of email address',
          required: true,
          options: {
            options: [
              { label: 'Primary', value: 'primary' },
              { label: 'Invoicing', value: 'invoicing' },
              { label: 'Secondary', value: 'secondary' },
            ],
          },
        }),
        email: Property.ShortText({
          displayName: 'Email Address',
          description: 'The email address',
          required: true,
        }),
      },
    }),
    telephones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the company',
      required: false,
      properties: {
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Type of phone number',
          required: true,
          options: {
            options: [
              { label: 'Primary', value: 'primary' },
              { label: 'Mobile', value: 'mobile' },
              { label: 'Direct', value: 'direct' },
            ],
          },
        }),
        number: Property.ShortText({
          displayName: 'Phone Number',
          description: 'The phone number',
          required: true,
        }),
      },
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The website URL of the company',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The language code (e.g., en, nl, fr, de)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      name,
      businessType,
      vatNumber,
      emails,
      telephones,
      website,
      language,
    } = propsValue;
    const requestBody = {
      name,
      business_type: businessType,
      vat_number: vatNumber,
      emails,
      telephones,
      website,
      language,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.add',
      requestBody
    );

    return response;
  },
});

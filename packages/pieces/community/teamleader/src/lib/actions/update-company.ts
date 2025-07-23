import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCompany = createAction({
  auth: teamleaderAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Update an existing company in Teamleader',
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: false,
    }),
    businessType: Property.StaticDropdown({
      displayName: 'Business Type',
      description: 'The type of business',
      required: false,
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
    const requestBody: Record<string, unknown> = {
      id: propsValue.companyId,
    };

    // Only include fields that are provided
    if (propsValue.name) requestBody['name'] = propsValue.name;
    if (propsValue.businessType)
      requestBody['business_type'] = propsValue.businessType;
    if (propsValue.vatNumber) requestBody['vat_number'] = propsValue.vatNumber;
    if (propsValue.emails) requestBody['emails'] = propsValue.emails;
    if (propsValue.telephones)
      requestBody['telephones'] = propsValue.telephones;
    if (propsValue.website) requestBody['website'] = propsValue.website;
    if (propsValue.language) requestBody['language'] = propsValue.language;

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.update',
      requestBody
    );

    return response;
  },
});

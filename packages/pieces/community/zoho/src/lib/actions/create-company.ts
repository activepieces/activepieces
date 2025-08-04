import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createCompany = createAction({
  auth: zohoAuth,
  name: 'create-company',
  displayName: 'Create Company',
  description: 'Add a new company record in Bigin',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: true,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'Industry or sector of the company',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Company phone number',
      required: false,
    }),
    fax: Property.ShortText({
      displayName: 'Fax',
      description: 'Company fax number',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'Company address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province',
      required: false,
    }),
    zipCode: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'ZIP or postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    annualRevenue: Property.Number({
      displayName: 'Annual Revenue',
      description: 'Annual revenue of the company',
      required: false,
    }),
    numberOfEmployees: Property.Number({
      displayName: 'Number of Employees',
      description: 'Number of employees in the company',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Additional notes about the company',
      required: false,
    }),
    leadSource: Property.StaticDropdown({
      displayName: 'Lead Source',
      description: 'Source of the lead',
      required: false,
      options: {
        options: [
          { label: 'Website', value: 'website' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Referral', value: 'referral' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Advertisement', value: 'advertisement' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    companyType: Property.StaticDropdown({
      displayName: 'Company Type',
      description: 'Type of company',
      required: false,
      options: {
        options: [
          { label: 'Prospect', value: 'prospect' },
          { label: 'Customer', value: 'customer' },
          { label: 'Partner', value: 'partner' },
          { label: 'Vendor', value: 'vendor' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      name,
      industry,
      website,
      phone,
      fax,
      address,
      city,
      state,
      zipCode,
      country,
      annualRevenue,
      numberOfEmployees,
      description,
      leadSource,
      companyType,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/companies`;

    const companyData = {
      name,
      industry,
      website,
      phone,
      fax,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      annual_revenue: annualRevenue,
      number_of_employees: numberOfEmployees,
      description,
      lead_source: leadSource,
      company_type: companyType,
    };

    // Remove null/undefined values
    Object.keys(companyData).forEach(key => {
      if (companyData[key as keyof typeof companyData] === null || companyData[key as keyof typeof companyData] === undefined) {
        delete companyData[key as keyof typeof companyData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create company: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 
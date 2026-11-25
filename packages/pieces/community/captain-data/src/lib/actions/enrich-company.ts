import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { captainDataClient, captainDataUtils } from '../common';

export const enrichCompany = createAction({
  name: 'enrich_company',
  classification: 'READ',
  displayName: 'Enrich Company',
  description:
    'Gets the full LinkedIn company profile from its LinkedIn company URL. Costs 1 credit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the LinkedIn company profile for li_company_url (/company/, /school/, /showcase/ or /sales/company/ URLs): name, description, website, industries, type, headcount (number_employees, employees_range), headquarters and location, specialties, locations, last funding investors and affiliates. Costs 1 credit. Get li_company_url from Find Company or Search Companies.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    li_company_url: Property.ShortText({
      displayName: 'LinkedIn Company URL',
      description: 'e.g. https://www.linkedin.com/company/activepieces',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'uid', label: 'Company UID' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'description', label: 'Description' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'type', label: 'Type' },
      { key: 'website', label: 'Website', format: 'url' },
      { key: 'domain', label: 'Domain' },
      { key: 'industry', label: 'Industry' },
      { key: 'industries', label: 'Industries' },
      { key: 'specialties', label: 'Specialties' },
      { key: 'li_company_id', label: 'LinkedIn Company ID' },
      { key: 'li_company_url', label: 'LinkedIn Company URL', format: 'url' },
      { key: 'sn_company_url', label: 'Sales Navigator URL', format: 'url' },
      { key: 'li_job_search_url', label: 'LinkedIn Jobs URL', format: 'url' },
      {
        key: 'li_employees_url',
        label: 'LinkedIn Employees URL',
        format: 'url',
      },
      { key: 'logo_url', label: 'Logo', format: 'image' },
      {
        key: 'number_employees',
        label: 'Number of Employees',
        format: 'number',
      },
      { key: 'employees_range', label: 'Employees Range' },
      {
        key: 'li_followers_count',
        label: 'LinkedIn Followers',
        format: 'number',
      },
      { key: 'headquarters', label: 'Headquarters' },
      { key: 'location', label: 'Location' },
      { key: 'country', label: 'Country' },
      { key: 'geographic_area', label: 'Geographic Area' },
      { key: 'city', label: 'City' },
      { key: 'postal_code', label: 'Postal Code' },
      {
        key: 'number_of_locations',
        label: 'Number of Locations',
        format: 'number',
      },
      {
        key: 'locations',
        label: 'Locations',
        labelKey: 'address',
        listItems: [
          { key: 'street', label: 'Street' },
          { key: 'address', label: 'Address' },
          { key: 'city', label: 'City' },
          { key: 'postal_code', label: 'Postal Code' },
          { key: 'geographic_area', label: 'Geographic Area' },
          { key: 'country', label: 'Country' },
        ],
      },
      { key: 'last_funding_investors', label: 'Last Funding Investors' },
      {
        key: 'affiliates',
        label: 'Affiliates',
        labelKey: 'company_name',
        listItems: [
          { key: 'company_uid', label: 'Company UID' },
          { key: 'company_name', label: 'Company Name' },
          { key: 'li_company_id', label: 'LinkedIn Company ID' },
          {
            key: 'li_company_url',
            label: 'LinkedIn Company URL',
            format: 'url',
          },
          { key: 'industry', label: 'Industry' },
          { key: 'followers_count', label: 'Followers', format: 'number' },
        ],
      },
      { key: 'li_page_claimed', label: 'Page Claimed', format: 'boolean' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      { key: 'founded_on', label: 'Founded Year', format: 'number' },
      { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
    ],
  },
  async run({ auth, propsValue }) {
    return captainDataClient.getObject({
      apiKey: auth.props.apiKey,
      path: '/companies/enrich',
      operation: 'enrich company',
      queryParams: {
        li_company_url: captainDataUtils.requireText({
          value: propsValue.li_company_url,
          field: 'LinkedIn Company URL',
        }),
      },
    });
  },
});

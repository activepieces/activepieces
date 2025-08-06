import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const searchCompany = createAction({
  auth: biginZohoAuth,
  name: 'searchCompany',
  displayName: 'Search Company',
  description: 'Look up companies by full name',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the company name or other search terms',
      required: true,
    }),
    searchField: Property.Dropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const response = await makeRequest(
            (auth as BiginZohoAuthType).access_token,
            HttpMethod.GET,
            '/settings/fields?module=Accounts',
            (auth as BiginZohoAuthType).location || 'com'
          );
          const fields = response.fields || [];
          const searchableFields = fields
            .filter((field: any) => 
              field.data_type === 'text' || 
              field.data_type === 'string' ||
              field.data_type === 'textarea'
            )
            .map((field: any) => ({
              label: field.display_label || field.api_name,
              value: field.api_name,
            }));
          
          return {
            disabled: false,
            options: [
              { label: 'All Fields', value: 'all' },
              ...searchableFields,
            ],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [
              { label: 'All Fields', value: 'all' },
              { label: 'Account Name', value: 'Account_Name' },
              { label: 'Phone', value: 'Phone' },
              { label: 'Website', value: 'Website' },
              { label: 'Description', value: 'Description' },
            ],
          };
        }
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of records per page (max: 200, default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const searchCriteria = context.propsValue.searchCriteria;
    const searchField = context.propsValue.searchField || 'all';
    const page = context.propsValue.page || 1;
    const perPage = Math.min(context.propsValue.perPage || 20, 200);

    let searchQuery: string;
    if (searchField === 'all') {
      searchQuery = `(Account_Name:${searchCriteria}) OR (Phone:${searchCriteria}) OR (Website:${searchCriteria}) OR (Description:${searchCriteria})`;
    } else {
      searchQuery = `${searchField}:${searchCriteria}`;
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/Accounts/search?criteria=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
      context.auth.props?.['location'] || 'com'
    );

    return {
      companies: response.data || [],
      totalRecords: response.info?.count || 0,
    };
  },
}); 
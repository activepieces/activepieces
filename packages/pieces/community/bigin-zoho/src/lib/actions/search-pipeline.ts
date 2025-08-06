import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const searchPipeline = createAction({
  auth: biginZohoAuth,
  name: 'searchPipeline',
  displayName: 'Search Pipeline Record',
  description: 'Retrieve deals by deal name',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the deal name or other search terms',
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
            '/settings/fields?module=Pipelines',
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
              { label: 'Deal Name', value: 'Deal_Name' },
              { label: 'Account Name', value: 'Account_Name' },
              { label: 'Stage', value: 'Stage' },
              { label: 'Sub Pipeline', value: 'Sub_Pipeline' },
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
      searchQuery = `(Deal_Name:${searchCriteria}) OR (Account_Name:${searchCriteria}) OR (Stage:${searchCriteria}) OR (Sub_Pipeline:${searchCriteria})`;
    } else {
      searchQuery = `${searchField}:${searchCriteria}`;
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/Pipelines/search?criteria=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
      context.auth.props?.['location'] || 'com'
    );

    return {
      pipelines: response.data || [],
      totalRecords: response.info?.count || 0,
    };
  },
}); 
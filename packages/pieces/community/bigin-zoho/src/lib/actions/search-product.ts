import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const searchProduct = createAction({
  auth: biginZohoAuth,
  name: 'searchProduct',
  displayName: 'Search Product',
  description: 'Search products by name or code',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the product name or code to search for',
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
            '/settings/fields?module=Products',
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
              { label: 'Product Name', value: 'Product_Name' },
              { label: 'Product Code', value: 'Product_Code' },
              { label: 'Product Category', value: 'Product_Category' },
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
      searchQuery = `(Product_Name:${searchCriteria}) OR (Product_Code:${searchCriteria}) OR (Product_Category:${searchCriteria}) OR (Description:${searchCriteria})`;
    } else {
      searchQuery = `${searchField}:${searchCriteria}`;
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/Products/search?criteria=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
      context.auth.props?.['location'] || 'com'
    );

    return {
      products: response.data || [],
      totalRecords: response.info?.count || 0,
    };
  },
}); 
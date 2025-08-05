import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchProduct = createAction({
  auth: biginAuth,
  name: 'searchProduct',
  displayName: 'Search Product',
  description: 'Search products by name or code',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the product name or code to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      options: {
        options: [
          { label: 'All Fields', value: 'all' },
          { label: 'Product Name', value: 'Product_Name' },
          { label: 'Product Code', value: 'Product_Code' },
          { label: 'Description', value: 'Description' },
          { label: 'Category', value: 'Product_Category' },
        ],
      },
      defaultValue: 'all',
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Number of records per page (default: 20, max: 200)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const searchCriteria = context.propsValue.searchCriteria;
    const searchField = context.propsValue.searchField || 'all';
    const page = context.propsValue.page || 1;
    const perPage = Math.min(context.propsValue.perPage || 20, 200);

    // Build search query based on field selection
    let searchQuery: string;
    
    if (searchField === 'all') {
      // Search across multiple fields using OR condition
      searchQuery = `(Product_Name:${searchCriteria}) OR (Product_Code:${searchCriteria}) OR (Description:${searchCriteria}) OR (Product_Category:${searchCriteria})`;
    } else {
      // Search in specific field
      searchQuery = `${searchField}:${searchCriteria}`;
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      criteria: searchQuery,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
     context.auth.props?.['location'] || 'com',
      `/Products/search?${queryParams.toString()}`
    );

    return {
      products: response.data || [],
      
    };
  },
});
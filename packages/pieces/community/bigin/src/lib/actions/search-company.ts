import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchCompany = createAction({
  auth: biginAuth,
  name: 'searchCompany',
  displayName: 'Search Company',
  description: 'Look up companies by full name',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the company name to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      options: {
        options: [
          { label: 'All Fields', value: 'all' },
          { label: 'Account Name', value: 'Account_Name' },
          { label: 'Phone', value: 'Phone' },
          { label: 'Website', value: 'Website' },
          { label: 'Description', value: 'Description' },
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
      searchQuery = `(Account_Name:${searchCriteria}) OR (Phone:${searchCriteria}) OR (Website:${searchCriteria}) OR (Description:${searchCriteria})`;
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
      `/Companies/search?${queryParams.toString()}`
    );

    return {
      companies: response.data || [],
    };
  },
});

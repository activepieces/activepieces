import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchPipelineRecord = createAction({
  auth: biginAuth,
  name: 'searchPipelineRecord',
  displayName: 'Search Pipeline Record',
  description: 'Retrieve deals by deal name',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the deal name or other criteria to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      options: {
        options: [
          { label: 'All Fields', value: 'all' },
          { label: 'Deal Name', value: 'Deal_Name' },
          { label: 'Stage', value: 'Stage' },
          { label: 'Sub Pipeline', value: 'Sub_Pipeline' },
          { label: 'Amount', value: 'Amount' },
          { label: 'Closing Date', value: 'Closing_Date' },
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

    // Build search query based on field selection with proper comparators
    let searchQuery: string;
    
    if (searchField === 'all') {
      // Search across multiple fields using OR condition with proper format
      searchQuery = `((Deal_Name:starts_with:${searchCriteria}) OR (Stage:starts_with:${searchCriteria}) OR (Sub_Pipeline:starts_with:${searchCriteria}))`;
    } else if (searchField === 'Amount') {
      // For numeric fields, use equals comparator
      searchQuery = `(${searchField}:equals:${searchCriteria})`;
    } else {
      // For text fields, use starts_with comparator
      searchQuery = `(${searchField}:starts_with:${searchCriteria})`;
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
      `/Deals/search?${queryParams.toString()}`
    );

    return {
      deals: response.data || [],
      totalRecords: response.info?.count || 0,
    };
  },
}); 
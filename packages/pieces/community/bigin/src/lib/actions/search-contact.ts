import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchContact = createAction({
  auth: biginAuth,
  name: 'searchContact',
  displayName: 'Search Contact',
  description: 'Find contacts by name, email, or phone',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the name, email, or phone number to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      options: {
        options: [
          { label: 'All Fields', value: 'all' },
          { label: 'First Name', value: 'First_Name' },
          { label: 'Last Name', value: 'Last_Name' },
          { label: 'Email', value: 'Email' },
          { label: 'Mobile', value: 'Mobile' },
          { label: 'Phone', value: 'Phone' },
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

    let searchQuery: string;

    if (searchField === 'all') {
      searchQuery = `(First_Name:${searchCriteria}) OR (Last_Name:${searchCriteria}) OR (Email:${searchCriteria}) OR (Mobile:${searchCriteria}) OR (Phone:${searchCriteria})`;
    } else {
      searchQuery = `${searchField}:${searchCriteria}`;
    }

    const queryParams = new URLSearchParams({
      criteria: searchQuery,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/Contacts/search?${queryParams.toString()}`,
       context.auth.props?.['location'] || 'com',
    );

    return {
      contacts: response.data || [],
      totalRecords: response.info?.count || 0,
    };
  },
});

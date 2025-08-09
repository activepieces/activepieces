import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';
import { BiginZohoAuthType } from '../common/auth';

export const searchUser = createAction({
  auth: biginZohoAuth,
  name: 'searchUser',
  displayName: 'Search User',
  description: 'Locate users by email',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the email or name to search for',
      required: true,
    }),
    searchField: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Select which field to search in',
      required: false,
      options: {
        options: [
          { label: 'All Fields', value: 'all' },
          { label: 'Email', value: 'email' },
          { label: 'First Name', value: 'first_name' },
          { label: 'Last Name', value: 'last_name' },
          { label: 'Full Name', value: 'full_name' },
        ],
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

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/users?page=${page}&per_page=${perPage}`,
      context.auth.props?.['location'] || 'com'
    );

    const users = response.users || [];
    let filteredUsers = users;

    if (searchField !== 'all') {
      filteredUsers = users.filter((user: any) => {
        const searchValue = user[searchField] || '';
        return searchValue.toLowerCase().includes(searchCriteria.toLowerCase());
      });
    } else {
      filteredUsers = users.filter((user: any) => {
        const email = user.email || '';
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const fullName = user.full_name || '';
        const searchLower = searchCriteria.toLowerCase();
        
        return email.toLowerCase().includes(searchLower) ||
               firstName.toLowerCase().includes(searchLower) ||
               lastName.toLowerCase().includes(searchLower) ||
               fullName.toLowerCase().includes(searchLower);
      });
    }

    return {
      users: filteredUsers,
      totalRecords: filteredUsers.length,
    };
  },
}); 
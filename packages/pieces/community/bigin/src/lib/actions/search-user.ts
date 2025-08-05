import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const searchUser = createAction({
  auth: biginAuth,
  name: 'searchUser',
  displayName: 'Search User',
  description: 'Locate users by email',
  props: {
    searchCriteria: Property.ShortText({
      displayName: 'Search Criteria',
      description: 'Enter the email address to search for',
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
      defaultValue: 'all',
    }),
    type: Property.StaticDropdown({
      displayName: 'User Type',
      description: 'Filter by user type',
      required: false,
      options: {
        options: [
          { label: 'All Users', value: 'AllUsers' },
          { label: 'Active Users', value: 'ActiveUsers' },
          { label: 'Deactive Users', value: 'DeactiveUsers' },
          { label: 'Confirmed Users', value: 'ConfirmedUsers' },
          { label: 'Not Confirmed Users', value: 'NotConfirmedUsers' },
          { label: 'Deleted Users', value: 'DeletedUsers' },
          { label: 'Active Confirmed Users', value: 'ActiveConfirmedUsers' },
        ],
      },
      defaultValue: 'ActiveUsers',
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
    const userType = context.propsValue.type || 'ActiveUsers';
    const page = context.propsValue.page || 1;
    const perPage = Math.min(context.propsValue.perPage || 20, 200);

    // Build query parameters
    const queryParams = new URLSearchParams({
      type: userType,
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      context.auth.props?.['location'] || 'com',
      `/users?${queryParams.toString()}`
    );

    // Filter users based on search criteria
    let filteredUsers = response.users || [];

    if (searchCriteria) {
      filteredUsers = filteredUsers.filter((user: any) => {
        const searchLower = searchCriteria.toLowerCase();

        if (searchField === 'all') {
          return (
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.first_name &&
              user.first_name.toLowerCase().includes(searchLower)) ||
            (user.last_name &&
              user.last_name.toLowerCase().includes(searchLower)) ||
            (user.full_name &&
              user.full_name.toLowerCase().includes(searchLower))
          );
        } else {
          const fieldValue = user[searchField];
          return fieldValue && fieldValue.toLowerCase().includes(searchLower);
        }
      });
    }

    return {
      users: filteredUsers,
      totalRecords: filteredUsers.length,
    };
  },
});

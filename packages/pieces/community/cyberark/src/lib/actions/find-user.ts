import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const findUser = createAction({
  auth: cyberarkAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Returns a list of existing users in the Vault based on filter criteria (requires Audit users permissions)',
  props: {
    filter: Property.ShortText({
      displayName: 'Filter',
      description: 'Filter users by userType, componentUser, or userName',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search by username, firstname, or lastname',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Sort by property (username, source, userType, location, lastname, firstname, middlename) followed by asc/desc',
      required: false,
    }),
    extendedDetails: Property.Checkbox({
      displayName: 'Extended Details',
      description: 'Returns additional user details including groups and userDN for LDAP users',
      required: false,
      defaultValue: false,
    }),
    pageOffset: Property.Number({
      displayName: 'Page Offset',
      description: 'Offset the first user returned in results',
      required: false,
      defaultValue: 0,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of users to return (used with offset)',
      required: false,
      defaultValue: 0,
    }),
    componentUser: Property.Checkbox({
      displayName: 'Component User Only',
      description: 'Filter to show only component users',
      required: false,
    }),
    userType: Property.StaticDropdown({
      displayName: 'User Type',
      description: 'Filter by specific user type',
      required: false,
      options: {
        options: [
          { label: 'EPV User', value: 'EPVUser' },
          { label: 'Built-in Admins', value: 'Built-InAdmins' },
          { label: 'LDAP User', value: 'LDAP' },
          { label: 'CPM', value: 'CPM' },
          { label: 'PVWA', value: 'PVWA' },
          { label: 'PSM', value: 'PSM' },
          { label: 'App Provider', value: 'AppProvider' },
          { label: 'Other (specify in Filter)', value: '' },
        ],
      },
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const queryParams = new URLSearchParams();

    if (context.propsValue.filter) {
      queryParams.append('filter', context.propsValue.filter);
    }

    if (context.propsValue.search) {
      queryParams.append('search', context.propsValue.search);
    }

    if (context.propsValue.sort) {
      queryParams.append('sort', context.propsValue.sort);
    }

    if (context.propsValue.extendedDetails) {
      queryParams.append('ExtendedDetails', 'true');
    }

    if (context.propsValue.pageOffset !== undefined && context.propsValue.pageOffset > 0) {
      queryParams.append('pageOffset', context.propsValue.pageOffset.toString());
    }

    if (context.propsValue.pageSize !== undefined && context.propsValue.pageSize > 0) {
      queryParams.append('pageSize', context.propsValue.pageSize.toString());
    }

    if (context.propsValue.componentUser !== undefined) {
      queryParams.append('componentUser', context.propsValue.componentUser.toString());
    }

    if (context.propsValue.userType && context.propsValue.userType !== '') {
      queryParams.append('userType', context.propsValue.userType);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${authData.serverUrl}/PasswordVault/API/Users?${queryString}` : `${authData.serverUrl}/PasswordVault/API/Users`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          users: response.body.Users || [],
          total: response.body.Total || 0,
          queryUsed: {
            url: url,
            parameters: Object.fromEntries(queryParams.entries()),
          },
        };
      } else {
        return {
          success: false,
          error: `Failed to find users. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find users',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
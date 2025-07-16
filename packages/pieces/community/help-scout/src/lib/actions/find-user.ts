import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { User } from '../common/types';

export const findUser = createAction({
  auth: helpScoutAuth,
  name: 'find-user',
  displayName: 'Find User',
  description: 'Searches for a Help Scout user by email or other criteria',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'What to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'User ID', value: 'id' },
          { label: 'Name', value: 'name' },
          { label: 'Role', value: 'role' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const {
      searchBy,
      searchValue,
      limit,
    } = context.propsValue;

    let users: User[] = [];

    try {
      if (searchBy === 'id') {
        // Search by specific user ID
        const user = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          `/users/${searchValue}`
        );
        users = [user];
      } else {
        // Get all users and filter
        const response = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.GET,
          '/users',
          undefined,
          {
            sortField: 'createdAt',
            sortOrder: 'desc',
          }
        );

        let allUsers = response._embedded.users || [];

        // Filter based on search criteria
        switch (searchBy) {
          case 'email':
            users = allUsers.filter((user: any) => 
              user.email.toLowerCase().includes(searchValue.toLowerCase())
            );
            break;
          case 'name':
            users = allUsers.filter((user: any) => 
              user.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
              user.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
              `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchValue.toLowerCase())
            );
            break;
          case 'role':
            users = allUsers.filter((user: any) => 
              user.role.toLowerCase().includes(searchValue.toLowerCase())
            );
            break;
          default:
            users = allUsers;
        }
      }

      // Apply limit if specified
      if (limit && users.length > limit) {
        users = users.slice(0, limit);
      }

      return {
        success: true,
        users,
        total: users.length,
      };
    } catch (error: any) {
      if (error.toString().includes('404')) {
        return {
          success: true,
          users: [],
          total: 0,
          message: 'No users found matching the criteria',
        };
      }
      throw new Error(`Failed to find users: ${error}`);
    }
  },
});
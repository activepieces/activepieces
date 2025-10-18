import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, User } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Finds a User',
  props: {
    userId: Property.Number({
      displayName: 'User ID',
      description: 'Specific user ID to retrieve',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by user email',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search by user name',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by user status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: 'Filter by user role',
      required: false,
    }),
  },
  async run(context) {
    if (context.propsValue.userId) {
      const response = await makeZendeskSellRequest<{ data: User }>(
        context.auth,
        HttpMethod.GET,
        `/users/${context.propsValue.userId}`
      );

      return {
        success: true,
        user: response.data,
        count: 1,
      };
    }
    const params = new URLSearchParams();
    if (context.propsValue.email) params.append('email', context.propsValue.email);
    if (context.propsValue.name) params.append('name', context.propsValue.name);
    if (context.propsValue.status) params.append('status', context.propsValue.status);
    if (context.propsValue.role) params.append('role', context.propsValue.role);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await makeZendeskSellRequest<{ items: User[] }>(
      context.auth,
      HttpMethod.GET,
      `/users${queryString}`
    );

    return {
      success: true,
      users: response.items,
      count: response.items.length,
    };
  },
});

import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const deleteUser = createAction({
  auth: zendeskAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Remove a user and associated records from the account. WARNING: Deleted users are not recoverable. Only admins and agents with permission to manage end users can delete users.',
  props: {
    user_id: Property.Dropdown({
      displayName: 'User',
      description: 'Select a user to delete. WARNING: This action is irreversible!',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }

        try {
          const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };
          
          // Fetch users from Zendesk API
          const response = await httpClient.sendRequest<{ users: Array<{ id: number; name: string; email: string; role: string; active: boolean }> }>({
            url: `https://${subdomain}.zendesk.com/api/v2/users.json?per_page=100&role[]=end-user&role[]=agent&role[]=admin`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: email + '/token',
              password: token,
            },
            timeout: 30000, // 30 seconds timeout
          });

          if (response.body.users && response.body.users.length > 0) {
            return {
              disabled: false,
              options: response.body.users
                .filter(user => user.active) // Only show active users
                .map((user) => ({
                  label: `${user.name} (${user.email}) - ${user.role}`,
                  value: user.id.toString(),
                })),
            };
          }

          return {
            disabled: true,
            placeholder: 'No users found',
            options: [],
          };
        } catch (error) {
          console.error('Error fetching users:', error);
          return {
            disabled: true,
            placeholder: 'Error loading users',
            options: [],
          };
        }
      },
    }),
    confirm_deletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'I understand that this action is irreversible and the user cannot be recovered',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    // Check if user confirmed the deletion
    if (!propsValue.confirm_deletion) {
      throw new Error('Deletion must be confirmed before proceeding');
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/users/${propsValue.user_id}.json`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
      timeout: 30000, // 30 seconds timeout
    });

    return {
      success: response.status === 204,
      message: response.status === 204 ? 'User deleted successfully' : 'Failed to delete user',
      status_code: response.status,
    };
  },
}); 
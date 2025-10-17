import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const userIdDropdown = Property.Dropdown({
  displayName: 'User',
  description: 'Select a user from the Vault (shows username, ID, type, and status)',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const serverUrl = (auth as any).serverUrl as string;
      const authToken = (auth as any).authToken as string;
      const baseUrl = serverUrl.replace(/\/$/, '');

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/PasswordVault/API/Users?pageSize=1000`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
      });

      if (response.status === 200 && response.body?.Users) {
        const users = response.body.Users;
        return {
          disabled: false,
          options: users.map((user: any) => ({
            label: `${user.username} (ID: ${user.id}) - ${user.userType}${user.componentUser ? ' [Component]' : ''}${user.suspended ? ' [Suspended]' : ''}${!user.enabled ? ' [Disabled]' : ''}`,
            value: user.id.toString(),
          })),
        };
      } else {
        return {
          disabled: true,
          placeholder: 'Failed to load users',
          options: [],
        };
      }
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading users',
        options: [],
      };
    }
  },
});
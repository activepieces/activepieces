import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken, CyberArkAuth } from './auth-helper';
import { cyberarkAuth } from '../..';

export const memberIdDropdown = Property.Dropdown({
  displayName: 'Member',
  description: 'Select a Vault user or enter LDAP group name to add to the group',
  required: true,
  refreshers: [],
  auth: cyberarkAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first',
        options: [],
      };
    }

    try {
      const authData = await getAuthToken(auth);

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${authData.serverUrl}/PasswordVault/API/Users?pageSize=1000`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
      });

      if (response.status === 200 && response.body?.Users) {
        const users = response.body.Users;
        return {
          disabled: false,
          options: users.map((user: any) => ({
            label: `${user.username} (ID: ${user.id}) - ${user.userType}${user.componentUser ? ' [Component]' : ''}${user.suspended ? ' [Suspended]' : ''}${!user.enabled ? ' [Disabled]' : ''}`,
            value: user.username,
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

import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken, CyberArkAuth } from './auth-helper';
import { cyberarkAuth } from '../..';

export const groupIdDropdown = Property.Dropdown({
  auth: cyberarkAuth,
  displayName: 'Group',
  description: 'Select a group from the Vault',
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
      const authData = await getAuthToken(auth);

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${authData.serverUrl}/PasswordVault/API/UserGroups`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
      });

      if (response.status === 200 && response.body?.value) {
        const groups = response.body.value;
        return {
          disabled: false,
          options: groups.map((group: any) => ({
            label: `${group.groupName} (ID: ${group.id}) - ${group.groupType}`,
            value: group.id.toString(),
          })),
        };
      } else {
        return {
          disabled: true,
          placeholder: 'Failed to load groups',
          options: [],
        };
      }
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading groups',
        options: [],
      };
    }
  },
});
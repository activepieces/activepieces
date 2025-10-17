import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const groupIdDropdown = Property.Dropdown({
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
      const serverUrl = (auth as any).serverUrl as string;
      const authToken = (auth as any).authToken as string;
      const baseUrl = serverUrl.replace(/\/$/, '');

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/PasswordVault/API/UserGroups`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
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
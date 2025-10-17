import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';

export const deleteUser = createAction({
  auth: cyberarkAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Deletes a specific user in the Vault',
  props: {
    userId: userIdDropdown,
  },
  async run(context) {
    const serverUrl = context.auth.serverUrl as string;
    const authToken = context.auth.authToken as string;
    const baseUrl = serverUrl.replace(/\/$/, '');

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${baseUrl}/PasswordVault/API/Users/${context.propsValue.userId}/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken as string,
        },
      });

      if (response.status === 204 || response.status === 200) {
        return {
          success: true,
          message: `User ${context.propsValue.userId} deleted successfully`,
        };
      } else {
        return {
          success: false,
          error: `Failed to delete user. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
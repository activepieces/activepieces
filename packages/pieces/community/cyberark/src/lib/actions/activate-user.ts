import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';

export const activateUser = createAction({
  auth: cyberarkAuth,
  name: 'activate_user',
  displayName: 'Activate User',
  description: 'Activates an existing user who was suspended after entering incorrect credentials multiple times',
  props: {
    userId: userIdDropdown,
  },
  async run(context) {
    const serverUrl = context.auth.serverUrl as string;
    const authToken = context.auth.authToken as string;
    const baseUrl = serverUrl.replace(/\/$/, '');

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/PasswordVault/API/Users/${context.propsValue.userId}/Activate/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken as string,
        },
      });

      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          message: `User ${context.propsValue.userId} activated successfully`,
        };
      } else {
        return {
          success: false,
          error: `Failed to activate user. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to activate user',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
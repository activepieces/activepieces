import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const activateUser = createAction({
  auth: cyberarkAuth,
  name: 'activate_user',
  displayName: 'Activate User',
  description: 'Activates an existing user who was suspended after entering incorrect credentials multiple times',
  audience: 'both',
  aiMetadata: {
    description: 'Reactivates a Vault user identified by user ID who was suspended after too many failed login attempts. Use to lift an automatic lockout. Idempotent: activating an already-active user leaves it active.',
    idempotent: true,
  },
  props: {
    userId: userIdDropdown,
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Users/${context.propsValue.userId}/Activate/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
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
import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const enableUser = createAction({
  auth: cyberarkAuth,
  name: 'enable_user',
  displayName: 'Enable User',
  description: 'Enables a specific user in the Vault',
  audience: 'both',
  aiMetadata: {
    description: 'Enables a Vault user identified by user ID so they can authenticate and access the Vault. Use to restore access to a disabled account. Idempotent: enabling an already-enabled user leaves it enabled.',
    idempotent: true,
  },
  props: {
    userId: userIdDropdown
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Users/${context.propsValue.userId}/enable/`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token
        }
      });

      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          message: `User ${context.propsValue.userId} enabled successfully`
        };
      } else {
        return {
          success: false,
          error: `Failed to enable user. Status: ${response.status}`,
          details: response.body
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to enable user',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});

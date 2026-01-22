import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const deleteUser = createAction({
  auth: cyberarkAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Deletes a specific user in the Vault (requires Add/Update Users authorization)',
  props: {
    userId: userIdDropdown,
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'Check this box to confirm you want to delete the selected user. This action cannot be undone.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    if (!context.propsValue.confirmDeletion) {
      return {
        success: false,
        error: 'Deletion not confirmed',
        message: 'Please check the confirmation box to proceed with user deletion.',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${authData.serverUrl}/PasswordVault/API/Users/${context.propsValue.userId}/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
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
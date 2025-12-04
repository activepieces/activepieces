import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { groupIdDropdown } from '../common/group-dropdown';
import { memberIdDropdown } from '../common/member-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const removeMemberFromGroup = createAction({
  auth: cyberarkAuth,
  name: 'remove_member_from_group',
  displayName: 'Remove Member from Group',
  description: 'Removes a specific user from a user group in the Vault',
  props: {
    groupId: groupIdDropdown,
    memberId: memberIdDropdown,
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    if (!context.propsValue.memberId) {
      return {
        success: false,
        error: 'Member ID is required. Please select or enter a member.',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${authData.serverUrl}/PasswordVault/API/UserGroups/${context.propsValue.groupId}/Members/${encodeURIComponent(String(context.propsValue.memberId))}/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
      });

      if (response.status === 204 || response.status === 200) {
        return {
          success: true,
          message: `Successfully removed ${context.propsValue.memberId} from group ${context.propsValue.groupId}`,
        };
      } else {
        return {
          success: false,
          error: `Failed to remove member from group. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to remove member from group',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
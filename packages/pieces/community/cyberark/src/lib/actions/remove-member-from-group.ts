import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { groupIdDropdown } from '../common/group-dropdown';

export const removeMemberFromGroup = createAction({
  auth: cyberarkAuth,
  name: 'remove_member_from_group',
  displayName: 'Remove Member from Group',
  description: 'Removes a specific user from a user group in the Vault',
  props: {
    groupId: groupIdDropdown,
    memberName: Property.ShortText({
      displayName: 'Member Name',
      description: 'The name of the group member to be removed',
      required: true,
    }),
  },
  async run(context) {
    const serverUrl = context.auth.serverUrl as string;
    const authToken = context.auth.authToken as string;
    const baseUrl = serverUrl.replace(/\/$/, '');

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${baseUrl}/PasswordVault/API/UserGroups/${context.propsValue.groupId}/Members/${encodeURIComponent(context.propsValue.memberName)}/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken as string,
        },
      });

      if (response.status === 204 || response.status === 200) {
        return {
          success: true,
          message: `Successfully removed ${context.propsValue.memberName} from group ${context.propsValue.groupId}`,
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
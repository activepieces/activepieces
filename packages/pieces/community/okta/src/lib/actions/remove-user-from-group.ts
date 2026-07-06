import { createAction, Property } from '@activepieces/pieces-framework';
import {
  oktaAuth,
  makeOktaRequest,
  userIdDropdown,
  groupIdDropdown,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeUserFromGroupAction = createAction({
  auth: oktaAuth,
  name: 'remove_user_from_group',
  displayName: 'Remove User from Group',
  description: 'Remove a user from an Okta group',
  audience: 'both',
  aiMetadata: { description: 'Removes a user from a specific Okta group, identified by group ID and user ID. Use to revoke group-based access or roles. Idempotent — removing a user who is not a member leaves membership unchanged.', idempotent: true },
  props: {
    groupId: groupIdDropdown,
    userId: userIdDropdown(true),
  },
  async run(context) {
    const userId = context.propsValue.userId;
    const groupId = context.propsValue.groupId;

    const response = await makeOktaRequest(
      context.auth,
      `/groups/${groupId}/users/${userId}`,
      HttpMethod.DELETE
    );

    return {
      success: true,
      userId,
      groupId,
      message: 'User removed from group',
    };
  },
});

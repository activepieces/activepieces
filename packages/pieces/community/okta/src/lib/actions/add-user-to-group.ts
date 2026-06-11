import { createAction } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown, groupIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';



export const addUserToGroupAction = createAction({
  auth: oktaAuth,
  name: 'add_user_to_group',
  displayName: 'Add User to Group',
  description: 'Add a user to a specific Okta group',
  audience: 'both',
  aiMetadata: { description: 'Adds an existing user to a specific Okta group, identified by user ID and group ID. Use to grant group-based access or roles. Idempotent — adding a user who is already a member leaves membership unchanged.', idempotent: true },
  props: {
    userId: userIdDropdown(),
    groupId: groupIdDropdown,
  },
  async run(context) {
    const userId = context.propsValue.userId;
    const groupId = context.propsValue.groupId;

    const response = await makeOktaRequest(
      context.auth,
      `/groups/${groupId}/users/${userId}`,
      HttpMethod.PUT
    );

    return {
      success: true,
      userId,
      groupId,
      message: 'User added to group',
    };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest, userIdDropdown, groupIdDropdown } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';



export const addUserToGroupAction = createAction({
  auth: oktaAuth,
  name: 'add_user_to_group',
  displayName: 'Add User to Group',
  description: 'Add a user to a specific Okta group',
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

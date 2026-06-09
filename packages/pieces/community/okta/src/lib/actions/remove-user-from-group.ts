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

import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const removeUserFromGroupAction = createAction({
  auth: oktaAuth,
  name: 'remove_user_from_group',
  displayName: 'Remove User from Group',
  description: 'Remove a user from an Okta group',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID or Email',
      description: 'The Okta user ID or email address',
      required: true,
    }),
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The Okta group ID',
      required: true,
    }),
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
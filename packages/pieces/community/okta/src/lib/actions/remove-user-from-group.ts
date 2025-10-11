import { createAction } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaRemoveUserFromGroupAction = createAction({
  auth: oktaAuth,
  name: 'okta_remove_user_from_group',
  displayName: 'Remove User from Group',
  description: 'Remove a user from an Okta group',
  props: {
    userId: oktaCommon.userDropdown,
    groupId: oktaCommon.groupDropdown,
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId, groupId } = propsValue;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.DELETE,
      resourceUri: `/api/v1/groups/${groupId}/users/${userId}`,
    });

    return {
      success: response.status === 204,
      message: response.status === 204 ? 'User removed from group successfully' : 'Failed to remove user from group',
    };
  },
});


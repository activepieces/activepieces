import { createAction } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue, oktaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const oktaAddUserToGroupAction = createAction({
  auth: oktaAuth,
  name: 'okta_add_user_to_group',
  displayName: 'Add User to Group',
  description: 'Add a user to a specific Okta group',
  props: {
    userId: oktaCommon.userDropdown,
    groupId: oktaCommon.groupDropdown,
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { userId, groupId } = propsValue;

    const response = await oktaApiCall({
      auth: authValue,
      method: HttpMethod.PUT,
      resourceUri: `/api/v1/groups/${groupId}/users/${userId}`,
    });

    return {
      success: response.status === 204,
      message: response.status === 204 ? 'User added to group successfully' : 'Failed to add user to group',
    };
  },
});


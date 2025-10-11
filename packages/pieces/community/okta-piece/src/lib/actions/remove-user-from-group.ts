import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const removeUserFromGroup = createAction({
  auth: oktaAuth,
  name: 'remove_user_from_group',
  displayName: 'Remove User from Group',
  description: 'Removes a user from an Okta group',
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the Okta group',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'An ID, login, or login shortname of an existing Okta user',
      required: true,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { groupId, userId } = context.propsValue;

    const url = `https://${domain}/api/v1/groups/${groupId}/users/${userId}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
    });

    return response.body || { success: true };
  },
});

import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const deleteUser = createAction({
  auth: zendeskAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Remove a user and associated records from the account',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user to delete',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { email, token, subdomain } = auth as { email: string; token: string; subdomain: string };

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/users/${propsValue.user_id}.json`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BASIC,
        username: email + '/token',
        password: token,
      },
    });

    return {
      success: response.status === 204,
      message: response.status === 204 ? 'User deleted successfully' : 'Failed to delete user',
    };
  },
}); 
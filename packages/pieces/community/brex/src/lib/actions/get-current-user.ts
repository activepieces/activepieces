import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexUser } from '../common';

export const getCurrentUser = createAction({
  auth: brexAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Get the user that the connected API token belongs to.',
  props: {},
  async run(context) {
    const response = await brexCommon.apiCall<BrexUser>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/users/me',
    });
    return brexCommon.flattenUser(response.body);
  },
});

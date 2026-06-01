import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { brexAuth } from '../../';
import { brexCommon, BrexUser } from '../common';

export const getUser = createAction({
  auth: brexAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Get the details of a single Brex user.',
  props: {
    userId: brexCommon.userDropdown,
  },
  async run(context) {
    const response = await brexCommon.apiCall<BrexUser>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/users/${context.propsValue.userId}`,
    });
    return brexCommon.flattenUser(response.body);
  },
});

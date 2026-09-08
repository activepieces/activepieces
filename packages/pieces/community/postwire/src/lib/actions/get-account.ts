import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postwireAuth } from '../auth';
import { postwireCommon } from '../common';

export const getAccount = createAction({
  auth: postwireAuth,
  name: 'get_account',
  displayName: 'Get Account',
  description: 'Plan, posts used this month and connected networks.',
  props: {},
  async run(context) {
    return postwireCommon.request(context.auth, HttpMethod.GET, '/api/me');
  },
});

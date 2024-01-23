import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

export const getAdmins = createAction({
  auth: onfleetAuth,
  name: 'get_admins',
  displayName: 'Get Administrators',
  description: 'Get many administrators',
  props: {},
  async run(context) {
    return await common.getAdmins(context.auth);
  },
});

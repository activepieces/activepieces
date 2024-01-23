import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteAdmin = createAction({
  auth: onfleetAuth,
  name: 'delete_admin',
  displayName: 'Delete Administrator',
  description: 'Delete an existing administrator',
  props: {
    admin: common.admin,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.administrators.deleteOne(
      context.propsValue.admin as string
    );
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const deleteAdmin = createAction({
  auth: onfleetAuth,
  name: 'delete_admin',
  displayName: 'Delete Administrator',
  description: 'Delete an existing administrator',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes an Onfleet administrator by admin ID. Destructive and not reversible; re-deleting an already-removed admin will error rather than be a no-op. Requires a known admin ID (use get-admins to find it).', idempotent: false },
  props: {
    admin: common.admin,
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth.secret_text);

    return await onfleetApi.administrators.deleteOne(
      context.propsValue.admin as string
    );
  },
});

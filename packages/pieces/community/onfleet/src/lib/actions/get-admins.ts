import { createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

export const getAdmins = createAction({
  auth: onfleetAuth,
  name: 'get_admins',
  displayName: 'Get Administrators',
  description: 'Get many administrators',
  audience: 'both',
  aiMetadata: { description: 'Lists all administrators in the Onfleet organization. Read-only and idempotent, taking no input. Use it to discover admin IDs before calling update-admin or delete-admin.', idempotent: true },
  props: {},
  async run(context) {
    return await common.getAdmins(context.auth.secret_text);
  },
});

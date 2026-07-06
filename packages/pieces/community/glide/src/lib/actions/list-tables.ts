import { createAction } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { listGlideTables } from '../common/client';

export const listTablesAction = createAction({
  auth: glideAuth,
  name: 'list-tables',
  displayName: 'List Tables',
  description: 'List the Glide Big Tables available to the authenticated team.',
  audience: 'both',
  aiMetadata: {
    description: 'List all Glide Big Tables accessible to the authenticated team, returning their IDs and names. Use this first to discover the table ID required by the row-level actions (get, add, update, delete). Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return listGlideTables(context.auth);
  },
});

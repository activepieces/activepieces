import { createAction } from '@activepieces/pieces-framework';

import { glideAuth } from '../auth';
import { listGlideTables } from '../common/client';

export const listTablesAction = createAction({
  auth: glideAuth,
  name: 'list-tables',
  displayName: 'List Tables',
  description: 'List the Glide Big Tables available to the authenticated team.',
  props: {},
  async run(context) {
    return listGlideTables(context.auth);
  },
});

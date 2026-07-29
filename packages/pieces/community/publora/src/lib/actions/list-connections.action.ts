import { createAction } from '@activepieces/pieces-framework';
import { publoraAuth } from '../auth';
import { listConnections } from '../common/client';

export const listConnectionsAction = createAction({
  auth: publoraAuth,
  name: 'list_connections',
  displayName: 'List Connected Accounts',
  description:
    'List the social accounts connected to Publora, with their platform IDs and token status.',
  props: {},
  async run({ auth }) {
    return await listConnections(auth);
  },
});

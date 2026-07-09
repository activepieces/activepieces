import { createAction } from '@activepieces/pieces-framework';
import { Client } from '../../common/Client';
import { vtexAuth } from '../../..';

export const getClientList = createAction({
  auth: vtexAuth,
  name: 'get-client-list',
  displayName: 'Get Client List',
  description: 'Find all Clients',
  audience: 'both',
  aiMetadata: {
    description:
      'List all clients (customers) registered in the VTEX store master data. Use to enumerate customers. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;

    const client = new Client(hostUrl, appKey, appToken);

    return await client.getClientList();
  },
});

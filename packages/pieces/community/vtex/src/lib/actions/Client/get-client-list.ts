import { createAction } from '@activepieces/pieces-framework';
import { Client } from '../../common/Client';
import { vtexAuth } from '../../..';

export const getClientList = createAction({
  auth: vtexAuth,
  name: 'get-client-list',
  displayName: 'Get Client List',
  description: 'Find all Clients',
  props: {},
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;

    const client = new Client(hostUrl, appKey, appToken);

    return await client.getClientList();
  },
});

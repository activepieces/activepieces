import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '../../common/Client';
import { vtexAuth } from '../../..';

export const getClientById = createAction({
  auth: vtexAuth,
  name: 'get-client-by-id',
  displayName: 'Get Client By ID',
  description: 'Find a Client by Id',
  props: {
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'The Client ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { clientId } = context.propsValue;

    const client = new Client(hostUrl, appKey, appToken);

    return await client.getClientById(clientId);
  },
});

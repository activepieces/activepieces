import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '../../common/Client';
import { vtexAuth } from '../../..';

export const getClientById = createAction({
  auth: vtexAuth,
  name: 'get-client-by-id',
  displayName: 'Get Client By ID',
  description: 'Find a Client by Id',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve a single client (customer) from the VTEX store master data by its client ID. Use when you already know the client ID and need its details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'The Client ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;
    const { clientId } = context.propsValue;

    const client = new Client(hostUrl, appKey, appToken);

    return await client.getClientById(clientId);
  },
});

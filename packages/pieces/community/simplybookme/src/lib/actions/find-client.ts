import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth } from '../common';

export const findClient = createAction({
  auth: simplybookAuth,
  name: 'find_client',
  displayName: 'Get Client List',
  description: 'Returns list of clients associated with company. Search by phone number, email address, or name.',
  props: {
    searchString: Property.ShortText({
      displayName: 'Search String',
      description: 'Search by phone number, email address, or name. Leave empty to get all clients.',
      required: false
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of clients to return. Leave empty for no limit.',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const { searchString, limit } = context.propsValue;

    const params = [
      searchString || '',
      limit !== undefined ? limit : null
    ];

    const clients = await makeJsonRpcCall(auth, 'getClientList', params);

    return clients;
  }
});

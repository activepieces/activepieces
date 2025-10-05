import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const deleteClientAction = createAction({
  auth: simplyBookAuth,
  name: 'delete_client',
  displayName: 'Delete Client',
  description: 'Delete an existing client',
  props: {
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'ID of the client to delete',
      required: true,
    }),
  },
  async run(context) {
    const { clientId } = context.propsValue;
    
    const params = {
      client_id: clientId,
    };

    return await makeApiRequest(context.auth, 'deleteClient', params);
  },
});

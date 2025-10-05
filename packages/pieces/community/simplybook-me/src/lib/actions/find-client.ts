import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const findClientAction = createAction({
  auth: simplyBookAuth,
  name: 'find_client',
  displayName: 'Find Client',
  description: 'Find clients based on search criteria',
  props: {
    clientId: Property.Number({
      displayName: 'Client ID',
      description: 'Specific client ID to find (optional)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address (optional)',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name (optional)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name (optional)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Search by phone number (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of clients to return',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { clientId, email, firstName, lastName, phone, limit } = context.propsValue;
    
    // If specific client ID is provided, get that client
    if (clientId) {
      return await makeApiRequest(context.auth, 'getClient', { client_id: clientId });
    }
    
    // Otherwise, search for clients
    const params: Record<string, any> = {
      ...(email && { email }),
      ...(firstName && { first_name: firstName }),
      ...(lastName && { last_name: lastName }),
      ...(phone && { phone }),
      limit: limit || 50,
    };

    return await makeApiRequest(context.auth, 'getClients', params);
  },
});

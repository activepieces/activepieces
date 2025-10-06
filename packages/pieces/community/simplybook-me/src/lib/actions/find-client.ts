import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, ClientQuery, ClientQuerySchema } from '../common';

export const findClient = createAction({
  auth: simplybookAuth,
  name: 'find_client',
  displayName: 'Find Client',
  description: 'Search for clients in SimplyBook.me',
  props: {
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'Filter by client name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Filter by email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Filter by phone number',
      required: false,
    }),
  },
  async run(context) {
    const { name, email, phone } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const query: ClientQuery = {
      name,
      email,
      phone,
    };

    const validatedQuery = ClientQuerySchema.parse(query);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const clients = await client.findClient(validatedQuery);
      return {
        success: true,
        clients,
        count: clients.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, createDropdownOptions } from '../common';

export const deleteClient = createAction({
  auth: simplybookAuth,
  name: 'delete_client',
  displayName: 'Delete Client',
  description: 'Delete a client from SimplyBook.me',
  props: {
    clientId: Property.Dropdown({
      displayName: 'Client',
      description: 'Select the client to delete',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.clients(auth),
    }),
  },
  async run(context) {
    const { clientId } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      await client.deleteClient(clientId);
      return {
        success: true,
        message: `Client ${clientId} deleted successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
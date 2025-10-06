import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, CreateClientDto, CreateClientDtoSchema } from '../common';

export const createClient = createAction({
  auth: simplybookAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in SimplyBook.me',
  props: {
    name: Property.ShortText({
      displayName: 'Client Name',
      description: 'Full name of the client',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Client email address',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Client phone number',
      required: false,
    }),
  },
  async run(context) {
    const { name, email, phone } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    // Validate input
    const payload: CreateClientDto = {
      name,
      email,
      phone,
    };

    const validatedPayload = CreateClientDtoSchema.parse(payload);

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const newClient = await client.createClient(validatedPayload);
      return {
        success: true,
        client: newClient,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
import { createAction, Property } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { createClient } from '../../index';

export const updateClientAction = createAction({
  auth: acuityschedulingAuth,
  name: 'update_client',
  displayName: 'Update Client',
  description: 'Update existing client information',
  props: {
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description: 'The ID of the client to update',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Client\'s first name',
      required: true,
    }),
     last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Client\'s last name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Client\'s email address',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Client\'s phone number',
      required: false,
    }),
  },
  async run(context) {
    const { 
      client_id,
      first_name,
      last_name,
      email,
      phone,
    } = context.propsValue;

    const client = createClient(context.auth);

    const updateData: Record<string, any> = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = first_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    try {
      const response = await client.patch(`/clients/${client_id}`, updateData);

      return {
        success: true,
        client: {
          id: response.data.id,
          first_name: response.data.fist_name,
          last_name: response.data.last_name,
          email: response.data.email,
          phone: response.data.phone,
        }
      };
    } catch (error:any) {
      console.error('Error updating client:', error);
      throw new Error(`Failed to update client: ${error.message}`);
    }
  },
});

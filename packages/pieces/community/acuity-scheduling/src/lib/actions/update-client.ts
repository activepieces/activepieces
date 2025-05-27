import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest, fetchClients } from '../common';
import { acuityAuth } from '../../index';

export const updateClient = createAction({
  name: 'update_client',
  displayName: 'Update Client',
  description: 'Update an existing client in Acuity Scheduling by specifying lookup info and new details.',
  auth: acuityAuth,
  props: {
    queryFirstName: Property.Dropdown({
      displayName: 'Current First Name',
      required: true,
      refreshers: ['queryLastName', 'queryEmail', 'queryPhone'],
      options: async ({ auth }) => {
        const clients = await fetchClients(auth as { userId: string; apiKey: string });
        return clients.map((client: any) => ({
          label: `${client.firstName} ${client.lastName} (${client.email || ''}, ${client.phone || ''})`,
          value: client.firstName,
        }));
      },
      description: 'Select the client first name to find for update.',
    }),
    queryLastName: Property.Dropdown({
      displayName: 'Current Last Name',
      required: true,
      refreshers: ['queryFirstName', 'queryEmail', 'queryPhone'],
      options: async ({ auth }) => {
        const clients = await fetchClients(auth as { userId: string; apiKey: string });
        return clients.map((client: any) => ({
          label: `${client.lastName} ${client.firstName} (${client.email || ''}, ${client.phone || ''})`,
          value: client.lastName,
        }));
      },
      description: 'Select the client last name to find for update.',
    }),
    queryPhone: Property.Dropdown({
      displayName: 'Current Phone',
      required: false,
      refreshers: ['queryFirstName', 'queryLastName', 'queryEmail'],
      options: async ({ auth }) => {
        const clients = await fetchClients(auth as { userId: string; apiKey: string });
        return clients.map((client: any) => ({
          label: `${client.phone} (${client.firstName} ${client.lastName}, ${client.email || ''})`,
          value: client.phone,
        }));
      },
      description: 'Select the client phone to find for update.',
    }),
    firstName: Property.ShortText({
      displayName: 'New First Name',
      required: true,
      description: 'Updated first name of the client',
    }),
    lastName: Property.ShortText({
      displayName: 'New Last Name',
      required: true,
      description: 'Updated last name of the client',
    }),
    phone: Property.ShortText({
      displayName: 'New Phone',
      required: false,
      description: 'Updated phone number of the client',
    }),
    email: Property.ShortText({
      displayName: 'New Email',
      required: false,
      description: 'Updated email address of the client',
    }),
    notes: Property.LongText({
      displayName: 'New Notes',
      required: false,
      description: 'Updated notes about the client',
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      firstName: context.propsValue.queryFirstName,
      lastName: context.propsValue.queryLastName,
    };
    if (context.propsValue.queryPhone) {
      queryParams['phone'] = context.propsValue.queryPhone;
    }

    const body = {
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      phone: context.propsValue.phone,
      email: context.propsValue.email,
      notes: context.propsValue.notes,
    };

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.PUT,
      '/clients',
      body,
      queryParams
    );
  },
});

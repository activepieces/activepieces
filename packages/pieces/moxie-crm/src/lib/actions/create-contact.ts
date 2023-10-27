import {
  Property,
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateContactAction = createAction({
  auth: moxieCRMAuth,
  name: 'create_contact',
  description: 'Create a new contact record',
  displayName: 'Create Contact',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    clientName: Property.Dropdown({
      displayName: 'Client',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const client = await makeClient(
          auth as PiecePropValueSchema<typeof moxieCRMAuth>
        );
        const clients = await client.listClients();
        return {
          disabled: false,
          options: clients.map((client) => {
            return {
              label: client.name,
              value: client.name,
            };
          }),
        };
      },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    defaultContact: Property.Checkbox({
      displayName: 'Default Contact',
      defaultValue: false,
      required: false,
    }),
    portalAccess: Property.Checkbox({
      displayName: 'Portal Access',
      defaultValue: false,
      required: false,
    }),
    invoiceContact: Property.Checkbox({
      displayName: 'Invoice Contact',
      defaultValue: false,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      firstName,
      lastName,
      phone,
      email,
      clientName,
      notes,
      invoiceContact,
      defaultContact,
      portalAccess,
    } = propsValue;
    const client = await makeClient(auth);
    return await client.createContact({
      first: firstName,
      last: lastName,
      clientName,
      notes,
      phone,
      email,
      defaultContact,
      portalAccess,
      invoiceContact,
    });
  },
});

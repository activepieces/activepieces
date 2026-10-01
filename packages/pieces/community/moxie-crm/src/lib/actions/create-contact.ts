import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { createContactActionOutputSchema } from '../output-schemas';

export const moxieCreateContactAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_contact',
  classification: 'WRITE',
  displayName: 'Create a Contact',
  description: 'Create a new contact record in moxie CRM.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a contact in Moxie CRM, optionally attached to an existing client by name. Use when adding a person to an account, or when a lead needs a named contact. Not idempotent: each call creates a separate contact even if the email matches an existing one.',
    idempotent: false,
  },
  outputSchema: createContactActionOutputSchema,
  props: {
    first: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last: Property.ShortText({
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
      auth: moxieCRMAuth,
      displayName: 'Client',
      description: 'The client this contact belongs to.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const client = await makeClient(auth);
        const clients = await client.listClients();
        return {
          options: clients.map((c) => ({ label: c.name, value: c.name })),
        };
      },
    }),
    defaultContact: Property.Checkbox({
      displayName: 'Default Contact',
      description: 'Make this the primary contact for the client.',
      required: false,
    }),
    invoiceContact: Property.Checkbox({
      displayName: 'Invoice Contact',
      description: 'Send invoices for the client to this contact.',
      required: false,
    }),
    portalAccess: Property.Checkbox({
      displayName: 'Portal Access',
      description: 'Allow this contact to sign in to the client portal.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = await makeClient(auth);
    return await client.createContact(propsValue);
  },
});

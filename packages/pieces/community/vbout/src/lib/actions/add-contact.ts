import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const addContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_contact',
  classification: 'WRITE',
  displayName: 'Add Contact to List',
  description: 'Adds a contact to a given email list.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds a new contact (by email) to a specific VBOUT email list, with an initial subscription status and optional custom field values. Use to subscribe or import someone into a list. Requires the target list ID and email; not idempotent, as each call adds the contact again.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
    status: vboutCommon.contactStatus({ required: true, width: 'half' }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      description: 'Where the contact signed up from.',
      placeholder: '203.0.113.7',
      required: false,
      width: 'half',
    }),
    listid: vboutCommon.listid({
      required: true,
      description: "The list's custom fields appear below once you pick it.",
    }),
    fields: vboutCommon.listFields,
  },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['email', 'status', 'ipaddress'],
    },
    {
      key: 'email_list',
      display: 'section',
      label: 'Email List',
      icon: 'inbox',
      props: ['listid', 'fields'],
    },
  ],
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    return await client.addContact(context.propsValue);
  },
});

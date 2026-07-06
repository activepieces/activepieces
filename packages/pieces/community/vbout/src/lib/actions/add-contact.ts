import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const addContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_contact',
  displayName: 'Add Contact to List',
  description: 'Adds a contact to a given email list.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds a new contact (by email) to a specific VBOUT email list, with an initial subscription status and optional custom field values. Use to subscribe or import someone into a list. Requires the target list ID and email; not idempotent, as each call adds the contact again.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    listid: vboutCommon.listid(true),
    status: vboutCommon.contactStatus(true),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      required: false,
    }),
    fields: vboutCommon.listFields,
  },
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    return await client.addContact(context.propsValue);
  },
});

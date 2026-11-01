import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const getContactByEmailAction = createAction({
  auth: vboutAuth,
  name: 'vbout_get_contact_by_email',
  classification: 'READ',
  displayName: 'Get Contact by Email',
  description: 'Finds a contact by email address.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up a VBOUT contact by email address, optionally scoped to a specific email list. Use to fetch a contact record or resolve its ID before updating, tagging, or unsubscribing. The email is required; this is a read-only lookup and is idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
    listid: vboutCommon.listid({
      required: false,
      description: 'Leave empty to search all your lists.',
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.secret_text);
    const { listid, email } = propsValue;

    return await client.getContactByEmail(email, listid);
  },
});

import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient, vboutCommon } from '../common';

export const addContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_contact',
  displayName: 'Add Contact to List',
  description: 'Adds a contact to a given email list.',
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
    const client = makeClient(context.auth as string);
    return await client.addContact(context.propsValue);
  },
});

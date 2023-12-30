import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, vboutCommon } from '../common';
import { vboutAuth } from '../..';

export const vboutAddContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_add_contact',
  displayName: 'Add Contact to List',
  description: 'Adds a contact to a given email list.',
  props: {
    listid: vboutCommon.listid(true),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      required: false,
    }),
    status: vboutCommon.contactStatus,
    fields: vboutCommon.listFields,
  },
  async run(context) {
    const client = makeClient(context.auth as string);
    return await client.addContact(context.propsValue);
  },
});

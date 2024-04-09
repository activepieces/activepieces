import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient, vboutCommon } from '../common';

export const getContactByEmailAction = createAction({
  auth: vboutAuth,
  name: 'vbout_get_contact_by_email',
  displayName: 'Get Contact by Email',
  description: 'Retrieves the contact by email.',
  props: {
    listid: vboutCommon.listid(false),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth as string);
    const { listid, email } = propsValue;

    return await client.getContactByEmail(email, listid);
  },
});

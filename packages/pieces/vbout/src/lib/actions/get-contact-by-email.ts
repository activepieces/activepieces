import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, vboutCommon } from '../common';
import { vboutAuth } from '../..';

export const vboutGetContactByEmailAction = createAction({
  auth: vboutAuth,
  name: 'vbout_get_contact_by_email',
  displayName: 'Get Contact by Email',
  description: 'Retrives the contact by email.',
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

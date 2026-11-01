import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';
import { ContactStatusValues } from '../common/models';

export const unsubscribeContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_unsubscribe_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Contact',
  description: 'Unsubscribes an existing contact in a given email list.',
  audience: 'both',
  aiMetadata: {
    description: 'Sets an existing VBOUT contact to unsubscribed status within a given email list, looking the contact up by email first. Use to opt a contact out of a list. Requires the contact email and list ID; idempotent, since re-running leaves the contact in the same unsubscribed state.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: true,
    }),
    listid: vboutCommon.listid({
      required: true,
      description: 'The contact is unsubscribed from this list.',
    }),
  },
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    const { email, listid } = context.propsValue;
    const res = await client.getContactByEmail(
      email as string,
      listid as string
    );
    const contact = res.response.data.contact;

    if ('errorCode' in contact) {
      return res;
    }
    if (contact.length === 0) {
      throw new Error('No contact with this email was found in the selected list.');
    }
    return await client.updateContact({
      id: contact[0].id,
      status: ContactStatusValues.UNSUBSCRIBE,
    });
  },
});

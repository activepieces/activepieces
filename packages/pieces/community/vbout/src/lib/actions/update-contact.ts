import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const updateContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_update_contact',
  displayName: 'Update Contact',
  description: 'Updates a contact in a given email list.',
  audience: 'both',
  aiMetadata: {
    description: 'Updates an existing VBOUT contact (found by email) with a new status, IP address, and custom field values for a given list. Use to modify an already-subscribed contact rather than add a new one. Requires the contact email and list ID; idempotent, since re-applying the same values yields the same record state.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
      description: 'Contact email for update.',
    }),
    listid: vboutCommon.listid(true),
    status: vboutCommon.contactStatus(false),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      required: false,
    }),
    fields: vboutCommon.listFields,
  },
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    const { email } = context.propsValue;
    const res = await client.getContactByEmail(email as string);
    const contact = res.response.data.contact;

    if ('errorCode' in contact) {
      return res;
    } else {
      const contactId = contact[0].id;
      return await client.updateContact({
        id: contactId,
        ...context.propsValue,
      });
    }
  },
});

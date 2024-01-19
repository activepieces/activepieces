import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient, vboutCommon } from '../common';

export const updateContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_update_contact',
  displayName: 'Update Contact',
  description: 'Updates a contact in a given email list.',
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
    const client = makeClient(context.auth as string);
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

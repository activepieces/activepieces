import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, vboutCommon } from '../common';
import { vboutAuth } from '../..';

export const vboutUpdateContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_update_contact',
  displayName: 'Update Contact',
  description: 'Updates a contact in a given email list.',
  props: {
    listid: vboutCommon.listid(true),
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
    }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          {
            label: 'Active',
            value: 'Active',
          },
          {
            label: 'Disactive',
            value: 'Disactive',
          },
        ],
      },
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

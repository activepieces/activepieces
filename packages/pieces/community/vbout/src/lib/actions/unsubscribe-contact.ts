import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../..';
import { makeClient, vboutCommon } from '../common';
import { ContactStatusValues } from '../common/models';

export const unsubscribeContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_unsubscribe_contact',
  displayName: 'Unsubscribe Contact',
  description: 'Unsubscribes an existing contact in a given email list.',
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
      description: 'Contact email for update.',
    }),
    listid: vboutCommon.listid(true),
  },
  async run(context) {
    const client = makeClient(context.auth as string);
    const { email, listid } = context.propsValue;
    const res = await client.getContactByEmail(
      email as string,
      listid as string
    );
    const contact = res.response.data.contact;

    if ('errorCode' in contact) {
      return res;
    } else {
      const contactId = contact[0].id;
      return await client.updateContact({
        id: contactId,
        status: ContactStatusValues.UNSUBSCRIBE,
      });
    }
  },
});

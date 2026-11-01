import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';

export const updateContactAction = createAction({
  auth: vboutAuth,
  name: 'vbout_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates a contact in one of your email lists.',
  audience: 'both',
  aiMetadata: {
    description: 'Updates an existing VBOUT contact (found by email) with a new status, IP address, and custom field values for a given list. Use to modify an already-subscribed contact rather than add a new one. Requires the contact email and list ID; idempotent, since re-applying the same values yields the same record state.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact is found by this email in the list below.',
      placeholder: 'jane@example.com',
      required: true,
    }),
    listid: vboutCommon.listid({
      required: true,
      description: "The list's custom fields appear below once you pick it.",
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    status: vboutCommon.contactStatus({ required: false, width: 'half' }),
    ipaddress: Property.ShortText({
      displayName: 'IP Address',
      description: 'Where the contact signed up from.',
      placeholder: '203.0.113.7',
      required: false,
      width: 'half',
    }),
    fields: vboutCommon.listFields,
  },
  propertyGroups: [
    {
      key: 'contact_to_update',
      display: 'section',
      label: 'Contact to Update',
      icon: 'user',
      props: ['email', 'listid'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changes_info', 'status', 'ipaddress', 'fields'],
    },
  ],
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    const { email, listid, status, ipaddress, fields } = context.propsValue;
    const res = await client.getContactByEmail(email, listid);
    const contact = res.response.data.contact;

    if ('errorCode' in contact) {
      return res;
    }
    if (contact.length === 0) {
      throw new Error('No contact with this email was found in the selected list.');
    }
    const nonEmptyFields = Object.fromEntries(
      Object.entries(fields ?? {}).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === 'string' && entry[1] !== ''
      )
    );
    return await client.updateContact({
      id: contact[0].id,
      email,
      listid,
      status,
      ...(ipaddress ? { ipaddress } : {}),
      fields: nonEmptyFields,
    });
  },
});

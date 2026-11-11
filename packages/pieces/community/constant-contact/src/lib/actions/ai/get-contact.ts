import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { contactOutputSchema } from '../../common/output-schemas';

export const getContactAiAction = createAction({
  auth: constantContactAuth,
  name: 'get_contact_ai',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Gets one contact with its lists, tags, phones, addresses and custom fields.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets one Constant Contact contact by contact_id or email, including email permission, list IDs, tag IDs, phone numbers, addresses and custom fields.',
    idempotent: true,
  },
  outputSchema: contactOutputSchema,
  props: {
    contact_id_or_email: aiProps.contactIdOrEmail(),
  },
  async run({ auth, propsValue }) {
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
    return ccContacts.getContact({ accessToken: auth.access_token, contactId });
  },
});

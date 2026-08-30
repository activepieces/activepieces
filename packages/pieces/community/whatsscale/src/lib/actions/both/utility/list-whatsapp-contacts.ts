import { createAction, Property } from '@activepieces/pieces-framework';
import { listWhatsappContactsOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const listWhatsappContactsAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_list_whatsapp_contacts',
  classification: 'SEARCH',
  displayName: 'List WhatsApp Contacts',
  description: 'List the raw WhatsApp contacts synced to a session. Not the same as the WhatsScale CRM contacts.',
  audience: 'both',
  aiMetadata: { description: 'Lists the WhatsApp contacts synced to a session directly from the phone/device, including each contact\'s chat ID. This is the raw WhatsApp address book, not the WhatsScale CRM — use List CRM Contacts instead for CRM-managed records. Read-only and idempotent.', idempotent: true },
  outputSchema: listWhatsappContactsOutputSchema,
  props: {
    session: whatsscaleProps.session,
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of contacts to return. Leave empty for the whole address book, which can run to thousands of entries.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { session, limit } = context.propsValue;

    const response = await whatsscaleClient(auth, HttpMethod.GET, `/api/${session}/contacts`);
    const contacts = response.body;
    if (typeof limit === 'number' && limit > 0 && Array.isArray(contacts)) {
      return contacts.slice(0, limit);
    }
    return contacts;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorCrmContact, flattenCrmContact } from '../../../common/crm';

export const getCrmContactByIdAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_get_crm_contact_by_id',
  classification: 'READ',
  displayName: 'Get a CRM Contact (By ID)',
  description: 'Retrieve a CRM contact by ID, entered directly rather than picked from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Fetch a single WhatsScale CRM contact by its contact ID. Read-only; pick this when you already hold the ID (e.g. from List CRM Contacts), versus Find a CRM Contact by Phone when you only have the phone number.', idempotent: true },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The WhatsScale CRM contact ID (from List CRM Contacts or Find a CRM Contact by Phone).',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.GET,
      `/api/crm/contacts/${contactId}`,
      undefined
    );
    return flattenCrmContact(response.body as ConductorCrmContact);
  },
});

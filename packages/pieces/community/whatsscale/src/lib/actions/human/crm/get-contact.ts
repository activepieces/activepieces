import { createAction } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { ConductorCrmContact, flattenCrmContact } from '../../../common/crm';

export const getCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_get_crm_contact',
  classification: 'READ',
  displayName: 'Get a CRM Contact',
  description: 'Retrieve a CRM contact by ID',
  audience: 'human',
  aiMetadata: { description: 'Fetch a single WhatsScale CRM contact by its contact ID. Read-only; pick this when you already hold the ID (e.g. from List CRM Contacts), versus Find a CRM Contact by Phone when you only have the phone number. Sources the contact from a builder dropdown. Its twin Get a CRM Contact (By ID) makes the identical call with the ID passed as free text, which is the better fit when an ID is already in hand.', idempotent: true },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: whatsscaleProps.crmContact,
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

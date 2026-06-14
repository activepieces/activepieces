import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const getCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_get_crm_contact',
  displayName: 'Get a CRM Contact',
  description: 'Retrieve a CRM contact by ID',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single WhatsScale CRM contact by its contact ID. Read-only; pick this when you already hold the ID (e.g. from List CRM Contacts), versus Find a CRM Contact by Phone when you only have the phone number.', idempotent: true },
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
    return response.body;
  },
});

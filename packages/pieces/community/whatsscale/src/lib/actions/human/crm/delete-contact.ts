import { createAction } from '@activepieces/pieces-framework';
import { deleteCrmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';

export const deleteCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_delete_crm_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a CRM Contact',
  description: 'Permanently delete a contact from your WhatsScale CRM',
  audience: 'human',
  aiMetadata: { description: 'Permanently remove a WhatsScale CRM contact by its contact ID. Destructive and irreversible, but idempotent: re-running converges on the contact being absent. Confirm the ID (via the list or lookup actions) before deleting. Sources the contact from a builder dropdown. Its twin Delete a CRM Contact (By ID) makes the identical call with the ID passed as free text, which is the better fit when an ID is already in hand.', idempotent: true },
  outputSchema: deleteCrmContactOutputSchema,
  props: {
    contactId: whatsscaleProps.crmContact,
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.DELETE,
      `/api/crm/contacts/${contactId}`,
      undefined
    );
    return response.body;
  },
});

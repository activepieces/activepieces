import { createAction, Property } from '@activepieces/pieces-framework';
import { deleteCrmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';

export const deleteCrmContactByIdAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_delete_crm_contact_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a CRM Contact (By ID)',
  description: 'Permanently delete a CRM contact by ID, entered directly rather than picked from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Permanently remove a WhatsScale CRM contact by its contact ID. Destructive and irreversible. Not idempotent: deleting an already-deleted contact fails the step with a 404, so a retry after a successful delete will fail. Confirm the ID (via the list or lookup actions) before deleting. Its twin Delete a CRM Contact makes the identical call but sources the contact from a builder dropdown instead of a free-text ID.', idempotent: false },
  outputSchema: deleteCrmContactOutputSchema,
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
      HttpMethod.DELETE,
      `/api/crm/contacts/${contactId}`,
      undefined
    );
    return response.body;
  },
});

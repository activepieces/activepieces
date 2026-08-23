import { createAction, Property } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorCrmContact, flattenCrmContact } from '../../../common/crm';

export const addCrmContactTagByIdAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_crm_contact_tag_by_id',
  classification: 'WRITE',
  displayName: 'Add a Tag to a CRM Contact (By ID)',
  description: 'Add a single tag to a CRM contact, entered directly rather than picked from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Attach one tag to an existing WhatsScale CRM contact identified by contact ID (tags are lowercased automatically). Adds a single tag per call; use Remove a Tag from a CRM Contact to reverse it. Requires a valid contact ID, which you can obtain via the list or lookup actions.', idempotent: false },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The WhatsScale CRM contact ID (from List CRM Contacts or Find a CRM Contact by Phone).',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Tag to add to the contact (e.g. vip). Tags are automatically lowercased.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId, tag } = context.propsValue;

    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      `/api/crm/contacts/${contactId}/tags`,
      { tag }
    );
    return flattenCrmContact(response.body as ConductorCrmContact);
  },
});

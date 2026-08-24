import { createAction, Property } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleProps } from '../../../common/props';
import { addTagsToCrmContact, flattenCrmContact } from '../../../common/crm';

export const addCrmContactTagAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_crm_contact_tag',
  classification: 'WRITE',
  displayName: 'Add Tags to a CRM Contact',
  description: 'Add one or more tags to an existing CRM contact',
  audience: 'human',
  aiMetadata: { description: 'Attach one or more tags to an existing WhatsScale CRM contact identified by contact ID (tags are lowercased automatically). Existing tags are kept, not replaced — use Update a CRM Contact to replace the whole set, or Remove a Tag from a CRM Contact to detach one. Each tag is sent as its own request, so a mid-way failure can leave earlier tags applied. Requires a valid contact ID, which you can obtain via the list or lookup actions.', idempotent: false },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: whatsscaleProps.crmContact,
    tags: Property.Array({
      displayName: 'Tags',
      description: 'One or more tags to add (e.g. vip, lead). Existing tags are kept; tags are automatically lowercased.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId, tags } = context.propsValue;

    const contact = await addTagsToCrmContact({ apiKey: auth, contactId, tags });
    return flattenCrmContact(contact);
  },
});

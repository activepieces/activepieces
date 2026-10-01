import { createAction, Property } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { whatsscaleAuth } from '../../../auth';
import { addTagsToCrmContact, flattenCrmContact } from '../../../common/crm';

export const addCrmContactTagByIdAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_crm_contact_tag_by_id',
  classification: 'WRITE',
  displayName: 'Add Tags to a CRM Contact (By ID)',
  description: 'Add one or more tags to a CRM contact, entered directly rather than picked from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Attach one or more tags to an existing WhatsScale CRM contact identified by contact ID (tags are lowercased automatically). Existing tags are kept, not replaced — use Update a CRM Contact to replace the whole set, or Remove a Tag from a CRM Contact to detach one. Each tag is sent as its own request, so a mid-way failure can leave earlier tags applied. Requires a valid contact ID, which you can obtain via the list or lookup actions. Its twin Add Tags to a CRM Contact makes the identical call but sources the contact from a builder dropdown instead of a free-text ID.', idempotent: false },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The WhatsScale CRM contact ID (from List CRM Contacts or Find a CRM Contact by Phone).',
      required: true,
    }),
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

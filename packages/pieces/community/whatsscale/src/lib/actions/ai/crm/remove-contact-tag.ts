import { createAction, Property } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorCrmContact, flattenCrmContact } from '../../../common/crm';

export const removeCrmContactTagByIdAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_remove_crm_contact_tag_by_id',
  classification: 'WRITE',
  displayName: 'Remove a Tag from a CRM Contact (By ID)',
  description: 'Remove a single tag from a CRM contact, entered directly rather than picked from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Detach one tag from a WhatsScale CRM contact identified by contact ID. Reverses Add a Tag to a CRM Contact; idempotent since the end state is the tag being absent. The contact itself is left intact. Its twin Remove a Tag from a CRM Contact makes the identical call but sources the contact from a builder dropdown instead of a free-text ID.', idempotent: true },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The WhatsScale CRM contact ID (from List CRM Contacts or Find a CRM Contact by Phone).',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The exact tag to remove (e.g. vip).',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth.secret_text;
    const { contactId, tag } = context.propsValue;
    const encodedTag = encodeURIComponent(tag);

    const response = await whatsscaleClient(
      auth,
      HttpMethod.DELETE,
      `/api/crm/contacts/${contactId}/tags/${encodedTag}`,
      undefined
    );
    return flattenCrmContact(response.body as ConductorCrmContact);
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { crmContactOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { whatsscaleProps } from '../../../common/props';
import { ConductorCrmContact, flattenCrmContact } from '../../../common/crm';

export const removeCrmContactTagAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_remove_crm_contact_tag',
  classification: 'WRITE',
  displayName: 'Remove a Tag from a CRM Contact',
  description: 'Remove a single tag from a CRM contact',
  audience: 'human',
  aiMetadata: { description: 'Detach one tag from a WhatsScale CRM contact identified by contact ID. Reverses Add a Tag to a CRM Contact; idempotent since the end state is the tag being absent. The contact itself is left intact. Sources the contact from a builder dropdown. Its twin Remove a Tag from a CRM Contact (By ID) makes the identical call with the ID passed as free text, which is the better fit when an ID is already in hand.', idempotent: true },
  outputSchema: crmContactOutputSchema,
  props: {
    contactId: whatsscaleProps.crmContact,
    tag: whatsscaleProps.crmTag,
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

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const addCrmContactTagAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_add_crm_contact_tag',
  displayName: 'Add a Tag to a CRM Contact',
  description: 'Add a single tag to an existing CRM contact',
  audience: 'both',
  aiMetadata: { description: 'Attach one tag to an existing WhatsScale CRM contact identified by contact ID (tags are lowercased automatically). Adds a single tag per call; use Remove a Tag from a CRM Contact to reverse it. Requires a valid contact ID, which you can obtain via the list or lookup actions.', idempotent: false },
  props: {
    contactId: whatsscaleProps.crmContact,
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
    return response.body;
  },
});

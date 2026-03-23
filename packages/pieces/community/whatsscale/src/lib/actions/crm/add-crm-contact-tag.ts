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

import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const removeCrmContactTagAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_remove_crm_contact_tag',
  displayName: 'Remove a Tag from a CRM Contact',
  description: 'Remove a single tag from a CRM contact',
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
    return response.body;
  },
});

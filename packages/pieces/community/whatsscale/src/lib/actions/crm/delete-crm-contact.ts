import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';

export const deleteCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_delete_crm_contact',
  displayName: 'Delete a CRM Contact',
  description: 'Permanently delete a contact from your WhatsScale CRM',
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

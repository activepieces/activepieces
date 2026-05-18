import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendTextToCrmContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_to_crm_contact',
  displayName: 'Send a Message to a CRM Contact',
  description: 'Send a text message to a contact from your WhatsScale CRM',
  props: {
    session: whatsscaleProps.session,
    crmContact: whatsscaleProps.crmContact,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  async run(context) {
    const { session, crmContact, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(
      RecipientType.CRM_CONTACT,
      session,
      crmContact,
    );
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text },
    );

    return response.body;
  },
});

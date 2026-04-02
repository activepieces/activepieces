import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendTextToContactAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_to_contact',
  displayName: 'Send a Message to a Contact',
  description:
    'Send a text message to a WhatsApp contact selected from your contact list',
  props: {
    session: whatsscaleProps.session,
    contact: whatsscaleProps.contact,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  async run(context) {
    const { session, contact, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(RecipientType.CONTACT, session, contact);
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text, platform: 'activepieces' },
    );

    return response.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendTextToChannelAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_to_channel',
  displayName: 'Send a Text to a Channel',
  description: 'Send a text message to a WhatsApp Channel',
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  async run(context) {
    const { session, channel, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(RecipientType.CHANNEL, session, channel);
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text },
    );

    return response.body;
  },
});

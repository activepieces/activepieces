import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';

export const sendTextToChannelAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_to_channel',
  classification: 'WRITE',
  displayName: 'Send a Text to a Channel',
  description: 'Send a text message to a WhatsApp Channel',
  audience: 'human',
  aiMetadata: { description: 'Broadcasts a text message to a WhatsApp Channel whose ID is chosen from the session channel list. Pick this for one-to-many channel posts rather than the contact/group/CRM text variants used for direct chats. Not idempotent: each call posts another message to the channel.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', icon: 'send', props: ['session', 'channel'] },
    { key: 'content', display: 'section' as const, label: 'Message', icon: 'text', props: ['text'] },
  ],
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

    return await resolveSendResult({ apiKey: auth, body: response.body });
  },
});

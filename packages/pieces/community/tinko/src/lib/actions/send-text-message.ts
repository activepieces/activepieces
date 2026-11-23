import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, TinkoSendMessageResult, tinkoClient } from '../common/client';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';
import { messageProps } from '../common/message';

export const sendTextMessageAction = createAction({
  auth: tinkoAuth,
  name: 'send_text_message',
  classification: 'WRITE',
  displayName: 'Send Text Message',
  description: 'Sends a text message to a contact through a Tinko channel.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a plain text message to a phone number, contact or WhatsApp group through a connected Tinko channel. Use Send Media Message for files and Send Template Message when the official WhatsApp 24 hour window is closed. Each call sends a new message, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    channel: tinkoProps.channelDropdown({
      description: 'The channel (connected number or account) that sends the message.',
    }),
    recipient: messageProps.recipient(),
    content: Property.LongText({
      displayName: 'Text',
      description: 'The text of the message, up to 4096 characters.',
      required: true,
    }),
    attendant: tinkoProps.attendantDropdown({
      description: 'The Tinko user registered as the sender of the message. Leave empty to send as the company.',
    }),
  },
  async run(context) {
    const { channel, recipient, content, attendant } = context.propsValue;
    const response = await tinkoClient.request<TinkoItemResponse<TinkoSendMessageResult>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/messages',
      body: messageProps.body({
        channel,
        recipient,
        attendant,
        fields: { type: 'text', content },
      }),
    });
    return tinkoOutput.sentMessage(response.data ?? {});
  },
});

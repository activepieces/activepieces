import { createAction, Property } from '@activepieces/pieces-framework';
import { recallAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendChatMessage = createAction({
  auth: recallAiAuth,
  name: 'sendChatMessage',
  displayName: 'Send Chat Message',
  description: 'Causes the bot to send a message in the meeting chat',
  props: {
    bot_id: Property.ShortText({
      displayName: 'Bot ID',
      description: 'A UUID string identifying the bot',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message that will be sent (max 4096 characters)',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'Send To',
      description:
        'The person or group that the message will be sent to. Defaults to "everyone". On non-Zoom platforms, only "everyone" is supported',
      required: false,
    }),
    pin: Property.Checkbox({
      displayName: 'Pin Message',
      description: 'Whether to pin the message in the chat',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { bot_id, message, to, pin } = context.propsValue;

    const body: Record<string, unknown> = {
      message,
    };

    if (to) {
      body['to'] = to;
    }

    if (pin) {
      body['pin'] = pin;
    }

    const response =  await makeRequest(
      context.auth.props.server,
      context.auth.props.api_key,
      HttpMethod.POST,
      `/bot/${bot_id}/send_chat_message/`,
      body
    );

    return response;
  },
});

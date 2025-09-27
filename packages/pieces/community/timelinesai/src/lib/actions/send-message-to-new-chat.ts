import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { sendMessageToNewChat as sendMessageToNewChatProps } from '../common/properties';
import { sendMessageToNewChat as sendMessageToNewChatSchema } from '../common/schemas';
import { sendMessageToNewChat as sendMessageToNewChatMethod } from '../common/methods';

export const sendMessageToNewChat = createAction({
  auth: timelinesaiAuth,
  name: 'sendMessageToNewChat',
  displayName: 'Send Message to New Chat',
  description: 'Create a new chat (new conversation) by specifying the WhatsApp account, phone number, and message',
  props: sendMessageToNewChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      sendMessageToNewChatSchema
    );

    return await sendMessageToNewChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});

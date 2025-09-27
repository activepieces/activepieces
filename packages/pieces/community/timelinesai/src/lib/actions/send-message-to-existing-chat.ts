import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { sendMessageToExistingChat as sendMessageToExistingChatProps } from '../common/properties';
import { sendMessageToExistingChat as sendMessageToExistingChatSchema } from '../common/schemas';
import { sendMessageToExistingChat as sendMessageToExistingChatMethod } from '../common/methods';

export const sendMessageToExistingChat = createAction({
  auth: timelinesaiAuth,
  name: 'sendMessageToExistingChat',
  displayName: 'Send Message to Existing Chat',
  description: 'Send a text message to an existing chat identified by chat_id',
  props: sendMessageToExistingChatProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      sendMessageToExistingChatSchema
    );

    return await sendMessageToExistingChatMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});

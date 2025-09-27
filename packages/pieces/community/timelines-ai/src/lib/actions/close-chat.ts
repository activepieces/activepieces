import { createAction } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { timelinesAiProps } from '../common/props';
import { UpdateChatRequest } from '../common/types';

export const closeChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'close_chat',
  displayName: 'Close Chat',
  description: 'Programmatically marks an existing chat as closed.',
  props: {
    chat_id: timelinesAiProps.chatId,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { chat_id } = propsValue;
    const payload: UpdateChatRequest = {
      state: 'closed',
    };
    const numericChatId =
      typeof chat_id === 'string' ? parseInt(chat_id, 10) : (chat_id as number);

    return await timelinesAiClient.updateChatState(
      auth,
      numericChatId,
      payload
    );
  },
});

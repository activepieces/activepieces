import { createAction } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { chatDropdown } from '../common/properties';

export const closeChat = createAction({
  auth: timelinesAiAuth,
  name: 'closeChat',
  displayName: 'Close Chat',
  description: 'Programmatically mark a chat as closed by its chat_id.',
  props: {
    chat_id: chatDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue: { chat_id } }) {
    const response = await timelinesAiCommon.updateChat({
      apiKey: apiKey,
      chat_id: Number(chat_id),
      closed: true,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Failed to close chat: ${response.message || 'Unknown error'}`
      );
    }
    return response;
  },
});

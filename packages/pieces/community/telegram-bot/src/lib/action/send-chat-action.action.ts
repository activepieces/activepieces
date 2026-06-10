import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { telegramCommons } from '../common';
import { telegramBotAuth } from '../..';

export const telegramSendChatActionAction = createAction({
  auth: telegramBotAuth,
  name: 'send_chat_action',
  displayName: 'Send Chat Action',
  description:
    'Show a status (typing, uploading photo, recording voice, etc.) on behalf of the bot in a chat. The status is shown for up to 5 seconds.',
  audience: 'both',
  aiMetadata: { description: 'Broadcasts a transient activity status (such as typing or uploading photo) in a chat, shown for up to 5 seconds. Use just before a slower action to signal the bot is working; it sends no message and produces no persistent content. Not idempotent: each call re-broadcasts the status.', idempotent: false },
  props: {
    instructions: telegramCommons.chatIdInstructions(),
    chat_id: telegramCommons.chatIdProp(),
    message_thread_id: telegramCommons.messageThreadIdProp(),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Type of action to broadcast.',
      required: true,
      options: {
        options: [
          { label: 'Typing', value: 'typing' },
          { label: 'Upload Photo', value: 'upload_photo' },
          { label: 'Record Video', value: 'record_video' },
          { label: 'Upload Video', value: 'upload_video' },
          { label: 'Record Voice', value: 'record_voice' },
          { label: 'Upload Voice', value: 'upload_voice' },
          { label: 'Upload Document', value: 'upload_document' },
          { label: 'Choose Sticker', value: 'choose_sticker' },
          { label: 'Find Location', value: 'find_location' },
          { label: 'Record Video Note', value: 'record_video_note' },
          { label: 'Upload Video Note', value: 'upload_video_note' },
        ],
      },
      defaultValue: 'typing',
    }),
  },
  async run(ctx) {
    return await httpClient.sendRequest<never>({
      method: HttpMethod.POST,
      url: telegramCommons.getApiUrl(ctx.auth, 'sendChatAction'),
      body: {
        chat_id: ctx.propsValue.chat_id,
        action: ctx.propsValue.action,
        message_thread_id: ctx.propsValue.message_thread_id ?? undefined,
      },
    });
  },
});

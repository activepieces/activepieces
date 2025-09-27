import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { timelinesAiProps } from '../common/props';
import { SendMessageRequest } from '../common/types';

export const sendMessageToExistingChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'send_message_to_existing_chat',
  displayName: 'Send Message to Existing Chat',
  description: 'Sends a text message to an existing WhatsApp chat.',
  props: {
    chat_id: timelinesAiProps.chatId,
    text: Property.LongText({
      displayName: 'Message',
      description:
        'The content of the message to send. Use "\\n" for line breaks.',
      required: true,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description:
        'Assign a label to the chat (creates a new label if it does not exist).',
      required: false,
    }),
    file_uid: Property.ShortText({
      displayName: 'File UID',
      description:
        'UID of a file previously uploaded to TimelinesAI to attach to the message.',
      required: false,
    }),
    attachment_template_id: Property.Number({
      displayName: 'Attachment Template ID',
      description: 'ID of an attachment template to be sent.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { chat_id, text, label, file_uid, attachment_template_id } =
      propsValue;
    const payload: SendMessageRequest = { text };
    if (label) payload.label = label;
    if (file_uid) payload.file_uid = file_uid;
    if (attachment_template_id)
      payload.attachment_template_id = attachment_template_id;

    const numericChatId = typeof chat_id === 'string' ? parseInt(chat_id, 10) : (chat_id as number);
    return await timelinesAiClient.sendMessage(auth, numericChatId, payload);
  },
});

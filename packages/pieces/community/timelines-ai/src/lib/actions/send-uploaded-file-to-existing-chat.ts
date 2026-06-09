import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { chatDropdown, fileDropdown } from '../common/properties';

export const sendUploadedFileToExistingChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendUploadedFileToExistingChat',
  displayName: 'Send Uploaded File to Existing Chat',
  description:
    'Send a file (media/attachment) to a chat, with metadata like file name, via existing chat.',
  audience: 'both',
  aiMetadata: { description: 'Sends an already-uploaded file, selected by its file uid, as an attachment into an existing TimelinesAI WhatsApp chat identified by its numeric chat_id. Use when the file is already uploaded (e.g. found via Find Uploaded File); use Send File to Existing Chat to upload and send raw file data in one step. Not idempotent: each call posts a new message.', idempotent: false },
  props: {
    chat_id: chatDropdown({ required: true }),
    file_id: fileDropdown({ required: true }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { chat_id, file_id } = propsValue;
    if (chat_id === undefined) {
      throw new Error('chat_id is required');
    }

    const response = await timelinesAiCommon.sendMessageToExistingChat({
      apiKey,
      chat_id: Number(chat_id),
      file_uid: file_id,
    });

    if (response.status !== 'ok') {
      throw new Error(response.message || 'Sending message failed');
    }

    return response.data;
  },
});

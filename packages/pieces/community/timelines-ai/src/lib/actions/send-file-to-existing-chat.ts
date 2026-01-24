import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { chatDropdown } from '../common/properties';

export const sendFileToExistingChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendFileToExistingChat',
  displayName: 'Send File to Existing Chat',
  description: 'Similar to above: send a file attachment to a chat using URL or file input and name.',
  props: {
      chat_id: chatDropdown({ required: true }),
      file: Property.File({
        displayName: 'File',
        description: 'The file to be sent in the chat.',
        required: true,
      }),
    },
    async run({ auth: apiKey, propsValue }) {
      const { chat_id, file } = propsValue;
      if (chat_id === undefined) {
        throw new Error('chat_id is required');
      }
      const fileUploadResponse = await timelinesAiCommon.uploadFile({
        apiKey,
        file: file.data,
        filename: file.filename,
      });
      if (fileUploadResponse.status !== 'ok') {
        throw new Error('File upload failed');
      }
      const response = await timelinesAiCommon.sendMessageToExistingChat({
        apiKey,
        chat_id: Number(chat_id),
        file_uid: fileUploadResponse.data.uid,
      });
      if (response.status !== 'ok') {
        throw new Error(response.message || 'Sending file to chat failed');
      }
      return response.data;
    },
});

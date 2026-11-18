import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { chatDropdown } from '../common/properties';

export const sendFileToExistingChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendFileToExistingChat',
  classification: 'WRITE',
  displayName: 'Send File to Existing Chat',
  description: 'Uploads a file and sends it to an existing chat.',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file and sends it as an attachment into an existing TimelinesAI WhatsApp chat identified by its numeric chat_id. Use when you have raw file data to deliver into a known chat. Not idempotent: each call uploads the file and posts a new message.', idempotent: false },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['chat_id'],
    },
    {
      key: 'file',
      display: 'section',
      label: 'File',
      icon: 'paperclip',
      props: ['file'],
    },
  ],
  props: {
    chat_id: chatDropdown({
      description: 'The chat to send the file to.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload and send.',
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
      throw new Error(
        fileUploadResponse.message
          ? `File upload failed: ${fileUploadResponse.message}`
          : 'File upload failed'
      );
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

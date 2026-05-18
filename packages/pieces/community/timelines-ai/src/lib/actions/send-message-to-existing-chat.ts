import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { chatDropdown } from '../common/properties';

export const sendMessageToExistingChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendMessageToExistingChat',
  displayName: 'Send Message to Existing Chat',
  description: 'Sends a text message in a chat identified by chat_id',
  props: {
    chat_id: chatDropdown({ required: true }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The text content of the message to be sent.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'Optional file to send with the message.',
      required: false,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Optional label to categorize or tag the message.',
      required: false,
    }),
    attachment_template_id: Property.Number({
      displayName: 'Attachment Template ID',
      description:
        'Optional ID of the attachment template to use for the message.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { chat_id, file, ...rest } = propsValue;
    if (chat_id === undefined) {
      throw new Error('chat_id is required');
    }
    const messageParams = {
      chat_id: Number(chat_id),
      file_uid: undefined as string | undefined,
      ...rest,
    };
    if (file !== undefined) {
      const fileUploadResponse = await timelinesAiCommon.uploadFile({
        apiKey,
        file: file.data,
        filename: file.filename,
      });
      if (fileUploadResponse.status !== 'ok') {
        throw new Error('File upload failed');
      }
      messageParams['file_uid'] = fileUploadResponse.data.uid;
    }

    const response = await timelinesAiCommon.sendMessageToExistingChat({
      apiKey,
      ...messageParams,
    });

    if (response.status !== 'ok') {
      throw new Error(response.message || 'Failed to send message');
    }

    return response.data;
  },
});

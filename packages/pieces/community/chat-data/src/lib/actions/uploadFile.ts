import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { chatDataAuth } from '../common/types';

export const uploadFile = createAction({
  auth: chatDataAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description:
    'Upload a file to be used with a chatbot for training or knowledge base',
  props: {
    chatbotId: Property.Dropdown({
      auth: chatDataAuth,
      displayName: 'Chatbot',
      description: 'Select the chatbot to upload file to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const client = new ChatDataClient(auth.secret_text);
          const chatbots = await client.listChatbots();
          return {
            options: chatbots.map((chatbot) => ({
              label: chatbot.name,
              value: chatbot.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load chatbots',
          };
        }
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload to the chatbot',
      required: true,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth.secret_text);

    const { file, chatbotId } = context.propsValue;

    const fileData = Buffer.from(file.base64, 'base64');
    const fileMeta = {
      filename: file.filename || 'uploaded-file',
      contentType: file.extension
        ? `application/${file.extension}`
        : 'application/octet-stream',
    };

    return await client.uploadFile(chatbotId, fileData, fileMeta);
  },
});

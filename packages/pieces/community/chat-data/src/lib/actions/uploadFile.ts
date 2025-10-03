import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';

export const uploadFile = createAction({
  name: 'upload_file',
  displayName: 'Upload File',
  description:
    'Upload a file to be used with a chatbot for training or knowledge base',
  props: {
    chatbotId: Property.Dropdown({
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
          const client = new ChatDataClient(auth as string);
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
      required: false,
    }),
    fileBase64: Property.LongText({
      displayName: 'File Base64 (Alternative)',
      description:
        'Base64 encoded file content (use if File input is not available)',
      required: false,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path (Alternative)',
      description: 'Path to local file (use if File input is not available)',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description:
        'Name of the file (required only when using Base64 or File Path)',
      required: false,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description:
        'MIME type of the file (required only when using Base64 or File Path)',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth as string);

    const { file, fileBase64, filePath, filename, contentType, chatbotId } =
      context.propsValue;

    let fileData: string | Buffer;
    let fileMeta: { filename: string; contentType: string };

    if (file) {
      fileData = Buffer.from(file.base64, 'base64');
      fileMeta = {
        filename: file.filename || 'uploaded-file',
        contentType: file.extension
          ? `application/${file.extension}`
          : 'application/octet-stream',
      };
    } else if (fileBase64) {
      if (!filename || !contentType) {
        throw new Error(
          'filename and contentType are required when using fileBase64'
        );
      }
      fileData = fileBase64;
      fileMeta = { filename, contentType };
    } else if (filePath) {
      if (!filename || !contentType) {
        throw new Error(
          'filename and contentType are required when using filePath'
        );
      }
      fileData = filePath;
      fileMeta = { filename, contentType };
    } else {
      throw new Error('Either file, fileBase64, or filePath must be provided');
    }

    return await client.uploadFile(chatbotId, fileData, fileMeta);
  },
});

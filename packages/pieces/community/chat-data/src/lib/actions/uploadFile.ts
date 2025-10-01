import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';

export const uploadFile = createAction({
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to a chatbot',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'ID of the chatbot',
      required: true,
    }),
    fileBase64: Property.LongText({
      displayName: 'File Base64',
      description: 'Base64 encoded file content',
      required: false,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path to local file',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the file',
      required: true,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type of the file',
      required: true,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth);
    
    const { fileBase64, filePath, filename, contentType, chatbotId } = context.propsValue;
    
    if (!fileBase64 && !filePath) {
      throw new Error('Either fileBase64 or filePath must be provided');
    }
    
    const file = fileBase64 || filePath!;
    
    return await client.uploadFile(chatbotId, file, { filename, contentType });
  },
});
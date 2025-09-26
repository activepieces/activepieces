import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { timelinesAiProps } from '../common/props';
import { SendMessageRequest, UploadFileByUrlRequest } from '../common/types';

export const sendUploadedFileToExistingChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'send_uploaded_file_to_existing_chat',
  displayName: 'Send File to Existing Chat',
  description:
    'Uploads a file from a URL and sends it to an existing WhatsApp chat.',
  props: {
    chat_id: timelinesAiProps.chatId,
    download_url: Property.ShortText({
      displayName: 'File URL',
      description: 'A publicly accessible URL for the file to upload and send.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'An optional text caption to send along with the file.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename (Optional)',
      description: 'An optional filename to use instead of the original.',
      required: false,
    }),
    content_type: Property.ShortText({
      displayName: 'MIME Type (Optional)',
      description: 'An optional mime-type for the file (e.g., image/jpeg).',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const { chat_id, download_url, caption, filename, content_type } =
      propsValue;

    const uploadPayload: UploadFileByUrlRequest = { download_url };
    if (filename) uploadPayload.filename = filename;
    if (content_type) uploadPayload.content_type = content_type;

    const uploadResponse = await timelinesAiClient.uploadFileByUrl(
      auth,
      uploadPayload
    );
    const fileUid = uploadResponse.data.uid;

    const sendMessagePayload: SendMessageRequest = {
      file_uid: fileUid,
    };
    if (caption) sendMessagePayload.text = caption;
    const numericChatId = typeof chat_id === 'string' ? parseInt(chat_id, 10) : (chat_id as number);
    return await timelinesAiClient.sendMessage(
      auth,
      numericChatId,
      sendMessagePayload
    );
  },
});

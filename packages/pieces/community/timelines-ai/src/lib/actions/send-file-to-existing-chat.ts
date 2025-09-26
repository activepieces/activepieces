import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { Buffer } from 'node:buffer';
import { timelinesAiAuth } from '../common/auth';
import { timelinesAiClient } from '../common/client';
import { timelinesAiProps } from '../common/props';

type FileData = { filename: string; data: Buffer };

export const sendFileToExistingChatAction = createAction({
  auth: timelinesAiAuth,
  name: 'send_file_to_existing_chat',
  displayName: 'Send File to Existing Chat',
  description:
    'Uploads a file from a URL or file input and sends it to a chat.',
  props: {
    chat_id: timelinesAiProps.chatId,
    source: Property.StaticDropdown({
      displayName: 'File Source',
      description:
        'Choose whether to upload from a URL or use a file from a previous step.',
      required: true,
      options: {
        options: [
          { label: 'File URL', value: 'url' },
          { label: 'File Content', value: 'file' },
        ],
      },
    }),
    file_or_url: Property.DynamicProperties({
      displayName: 'File Input',
      required: true,
      refreshers: ['source'],
      props: async (propsValue) => {
        const source = propsValue['source'] as unknown as string;
        const fields: DynamicPropsValue = {};

        if (source === 'url') {
          fields['download_url'] = Property.ShortText({
            displayName: 'File URL',
            description:
              'A publicly accessible URL for the file to upload and send.',
            required: true,
          });
        } else if (source === 'file') {
          fields['file'] = Property.File({
            displayName: 'File',
            description:
              'The file to upload and send (e.g., from a trigger or another action).',
            required: true,
          });
        }
        return fields;
      },
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'An optional text caption to send along with the file.',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    let fileUid: string;
    const fileOrUrlProps = propsValue.file_or_url as {
      download_url?: string;
      file?: FileData;
    };
    if (propsValue.source === 'url') {
      const uploadPayload = {
        download_url: fileOrUrlProps.download_url as string,
      };
      const response = await timelinesAiClient.uploadFileByUrl(
        auth,
        uploadPayload
      );
      fileUid = response.data.uid;
    } else {
      const file = fileOrUrlProps.file as FileData;
      const response = await timelinesAiClient.uploadFileByContent(auth, file);
      fileUid = response.file_uid;
    }
    const sendMessagePayload = {
      file_uid: fileUid,
      text: propsValue.caption as string | undefined,
    };
    return await timelinesAiClient.sendMessage(
      auth,
      propsValue.chat_id as number,
      sendMessagePayload
    );
  },
});

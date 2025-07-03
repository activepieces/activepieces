import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { discordCommon } from '../common';
import FormData from 'form-data';

interface FileObject {
  file:ApFile
}

export const sendMessageWithBot = createAction({
  name: 'sendMessageWithBot',
  auth:discordAuth,
  displayName: 'Send Message with Bot',
  description:
    'Send messages via bot to any channel or thread you want, with an optional file attachment.',
  props: {
    channel_id: discordCommon.channel,
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message content to send.',
      required: false,
    }),
    files: Property.Array({
      displayName: 'Attachments',
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'Optional file to send with the message.',
          required: false,
        }),
      },
      required: false,
      defaultValue: [],
    }),
  },
  async run(configValue) {
    const channelId = configValue.propsValue.channel_id;
    const message = configValue.propsValue.message;
    const files = configValue.propsValue.files as FileObject[] ?? [];
  
    const formData = new FormData();
    formData.append('content', message);
  
    if (files && files.length > 0) {
      files.forEach((fileObj, index) => {
        const file = fileObj.file;
        formData.append(`files[${index}]`, file.data, file.filename);
      });
    }
  
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://discord.com/api/v10/channels/${channelId}/messages`,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    };
  
    const res = await httpClient.sendRequest<never>(request);
  
    return res.body;
  }
  
});
